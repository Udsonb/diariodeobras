export interface ClimaData {
  clima_manha: string
  clima_tarde: string
  clima_noite: string
  temperatura_max: number
  temperatura_min: number
  precipitacao: number
  fonte: 'api' | 'manual'
}

const WMO_CODES: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Parcialmente nublado',
  2: 'Nublado',
  3: 'Encoberto',
  45: 'Nevoeiro',
  48: 'Nevoeiro com geada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa densa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Pancadas de chuva leves',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  95: 'Trovoada',
  96: 'Trovoada com granizo leve',
  99: 'Trovoada com granizo forte',
}

function descricaoClima(code: number): string {
  return WMO_CODES[code] ?? 'Condição desconhecida'
}

export async function buscarClima(
  latitude: number,
  longitude: number,
  data: string
): Promise<ClimaData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', latitude.toString())
    url.searchParams.set('longitude', longitude.toString())
    url.searchParams.set('hourly', 'weathercode,temperature_2m,precipitation')
    url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum')
    url.searchParams.set('timezone', 'America/Sao_Paulo')
    url.searchParams.set('start_date', data)
    url.searchParams.set('end_date', data)

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const json = await res.json()
    const daily = json.daily
    const hourly = json.hourly

    if (!daily || !hourly) return null

    // Horários: manhã ~9h, tarde ~14h, noite ~20h
    const hours = hourly.time as string[]
    const codes = hourly.weathercode as number[]

    const getCodeAtHour = (h: number) => {
      const idx = hours.findIndex(t => t.endsWith(`T${String(h).padStart(2, '0')}:00`))
      return idx >= 0 ? codes[idx] : daily.weathercode[0]
    }

    return {
      clima_manha: descricaoClima(getCodeAtHour(9)),
      clima_tarde: descricaoClima(getCodeAtHour(14)),
      clima_noite: descricaoClima(getCodeAtHour(20)),
      temperatura_max: daily.temperature_2m_max[0] ?? 0,
      temperatura_min: daily.temperature_2m_min[0] ?? 0,
      precipitacao: daily.precipitation_sum[0] ?? 0,
      fonte: 'api',
    }
  } catch {
    return null
  }
}
