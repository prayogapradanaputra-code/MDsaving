export type DetectedSource = {
  platform: string
  poster: string
  suggestedMode: 'video' | 'audio' | 'clip' | 'batch'
  suggestedQuality: 'Ultra' | 'Creator' | 'Audio HQ'
  format: string
  title: string
  description: string
}

export function detectSource(rawUrl: string): DetectedSource {
  const value = String(rawUrl || '').toLowerCase()

  if (value.includes('youtube') || value.includes('youtu.be')) {
    return {
      platform: 'YouTube',
      poster: 'YT',
      suggestedMode: 'video',
      suggestedQuality: 'Ultra',
      format: 'MP4 master',
      title: 'YouTube source detected',
      description: 'Sumber long-form terdeteksi untuk workflow edit utama.',
    }
  }

  if (value.includes('tiktok')) {
    return {
      platform: 'TikTok',
      poster: 'TT',
      suggestedMode: 'clip',
      suggestedQuality: 'Creator',
      format: 'MP4 vertical',
      title: 'TikTok source detected',
      description: 'Konten short-form terdeteksi untuk clip workflow.',
    }
  }

  if (value.includes('instagram')) {
    return {
      platform: 'Instagram',
      poster: 'IG',
      suggestedMode: 'clip',
      suggestedQuality: 'Creator',
      format: 'MP4 social',
      title: 'Instagram source detected',
      description: 'Konten sosial terdeteksi untuk repack dan inspiration library.',
    }
  }

  if (value.includes('spotify') || value.includes('audio')) {
    return {
      platform: 'Audio source',
      poster: 'AU',
      suggestedMode: 'audio',
      suggestedQuality: 'Audio HQ',
      format: 'WAV high bitrate',
      title: 'Audio source detected',
      description: 'Sumber audio terdeteksi untuk podcast atau musik berlisensi.',
    }
  }

  return {
    platform: 'External source',
    poster: 'MD',
    suggestedMode: 'video',
    suggestedQuality: 'Creator',
    format: 'Universal export',
    title: 'Generic source detected',
    description: 'Sumber umum terdeteksi untuk workflow media.',
  }
}
