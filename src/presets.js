/**
 * Built-in Preset Collections & Themes for Lucky Wheel
 */

export const THEMES = {
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: '⚡',
    palette: ['#00F0FF', '#FF0077', '#7B2CBF', '#FFE600', '#00FFA3', '#FF0055', '#3A86FF', '#FF5400'],
    rimColor: '#120E2E',
    pinColor: '#00F0FF',
    hubBg: 'linear-gradient(135deg, #00F0FF, #FF0077)',
    bezelBorder: '#00F0FF',
    bezelGlow: '0 0 45px rgba(0, 240, 255, 0.45), 0 0 80px rgba(255, 0, 119, 0.25)',
    pointerColor: '#FF0055',
    confettiColors: ['#00F0FF', '#FF0077', '#FFE600', '#00FFA3', '#7B2CBF']
  },
  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Casino / Altın Lüks',
    icon: '👑',
    palette: ['#D4AF37', '#0F4C3A', '#8B1E3F', '#E5C158', '#1B3B6F', '#C59B27', '#4A154B', '#9E2A2B'],
    rimColor: '#1B1713',
    pinColor: '#F7D070',
    hubBg: 'linear-gradient(135deg, #F3DC7B, #B8860B, #8B6508)',
    bezelBorder: '#D4AF37',
    bezelGlow: '0 0 50px rgba(212, 175, 55, 0.4), 0 0 80px rgba(184, 134, 11, 0.2)',
    pointerColor: '#FFD700',
    confettiColors: ['#FFD700', '#F3DC7B', '#E5C158', '#FFFFFF', '#0F4C3A']
  },
  'cosmic': {
    id: 'cosmic',
    name: 'Cosmic Deep Space',
    icon: '🌌',
    palette: ['#6B2CF5', '#3A0CA3', '#4361EE', '#4CC9F0', '#7209B7', '#F72585', '#560BAD', '#4895EF'],
    rimColor: '#0A0A1F',
    pinColor: '#4CC9F0',
    hubBg: 'linear-gradient(135deg, #7209B7, #4CC9F0)',
    bezelBorder: '#6B2CF5',
    bezelGlow: '0 0 50px rgba(107, 44, 245, 0.4), 0 0 80px rgba(76, 201, 240, 0.3)',
    pointerColor: '#4CC9F0',
    confettiColors: ['#6B2CF5', '#4CC9F0', '#F72585', '#4361EE', '#FFFFFF']
  },
  'pastel-candy': {
    id: 'pastel-candy',
    name: 'Pastel Rüya',
    icon: '🍭',
    palette: ['#FFB5A7', '#FCD5CE', '#F8EDEB', '#F9DCC4', '#FEC89A', '#B7E4C7', '#A0C4FF', '#FFC6FF'],
    rimColor: '#2D3142',
    pinColor: '#FFF',
    hubBg: 'linear-gradient(135deg, #FFB5A7, #A0C4FF)',
    bezelBorder: '#FFC6FF',
    bezelGlow: '0 0 45px rgba(255, 198, 255, 0.45), 0 0 70px rgba(160, 196, 255, 0.3)',
    pointerColor: '#FF6B6B',
    confettiColors: ['#FFB5A7', '#FEC89A', '#B7E4C7', '#A0C4FF', '#FFC6FF']
  },
  'sunset-synth': {
    id: 'sunset-synth',
    name: 'Sunset Synthwave',
    icon: '🌅',
    palette: ['#FF007F', '#FF5E00', '#FFAA00', '#8F00FF', '#00D4FF', '#FF0055', '#7928CA', '#FF4D4D'],
    rimColor: '#17092B',
    pinColor: '#FFAA00',
    hubBg: 'linear-gradient(135deg, #FF007F, #FFAA00)',
    bezelBorder: '#FF5E00',
    bezelGlow: '0 0 50px rgba(255, 94, 0, 0.45), 0 0 80px rgba(255, 0, 127, 0.3)',
    pointerColor: '#00D4FF',
    confettiColors: ['#FF007F', '#FF5E00', '#FFAA00', '#00D4FF', '#8F00FF']
  },
  'monochrome': {
    id: 'monochrome',
    name: 'Titanyum / Stealth',
    icon: '⚡',
    palette: ['#1E1E24', '#2B2D42', '#3D405B', '#495057', '#6C757D', '#ADB5BD', '#212529', '#343A40'],
    rimColor: '#111215',
    pinColor: '#E2E8F0',
    hubBg: 'linear-gradient(135deg, #E2E8F0, #4A5568)',
    bezelBorder: '#718096',
    bezelGlow: '0 0 40px rgba(255, 255, 255, 0.25)',
    pointerColor: '#FFFFFF',
    confettiColors: ['#FFFFFF', '#CBD5E0', '#718096', '#E2E8F0']
  }
};

export const PRESETS = [
  {
    id: 'food',
    name: 'Ne Yesek Bugün? 🍕🍔',
    description: 'Yemek seçmekte kararsız kalanlara lezzetli çözümler!',
    items: [
      { text: 'Pizza 🍕', color: '#E63946', weight: 1, active: true },
      { text: 'Döner / Kebap 🥙', color: '#D90429', weight: 1, active: true },
      { text: 'Burger & Patates 🍔', color: '#F77F00', weight: 1, active: true },
      { text: 'Ev Yemeği 🍲', color: '#2A9D8F', weight: 1, active: true },
      { text: 'Makarna 🍝', color: '#E9C46A', weight: 1, active: true },
      { text: 'Lahmacun & Pide 🌯', color: '#E76F51', weight: 1, active: true },
      { text: 'Suşi & Asya 🍣', color: '#9B5DE5', weight: 1, active: true },
      { text: 'Tavuk Dünyası 🍗', color: '#F15BB5', weight: 1, active: true },
      { text: 'Taze Salata & Fit 🥗', color: '#00F5D4', weight: 1, active: true }
    ]
  },
  {
    id: 'truth-or-dare',
    name: 'Doğruluk mu Cesaret mi? 🎭',
    description: 'Parti ve arkadaş buluşmalarının vazgeçilmezi!',
    items: [
      { text: 'Doğruluk 🤫', color: '#3A86FF', weight: 2, active: true },
      { text: 'Cesaret 🔥', color: '#FF006E', weight: 2, active: true },
      { text: 'Sır İtiraf Et 🤐', color: '#8338EC', weight: 1, active: true },
      { text: 'Dans Gösterisi 💃', color: '#FB5607', weight: 1, active: true },
      { text: 'Şanslısın! Pas Geç 🍀', color: '#06D6A0', weight: 1, active: true },
      { text: 'Çift Görev! 💥', color: '#FFBE0B', weight: 1, active: true }
    ]
  },
  {
    id: 'decision',
    name: 'Günün Kararı ⚖️',
    description: 'İkilemde kaldığın anlarda çark senin yerine karar versin.',
    items: [
      { text: 'Kesinlikle Evet! ✅', color: '#10B981', weight: 1, active: true },
      { text: 'Hayır, Asla! ❌', color: '#EF4444', weight: 1, active: true },
      { text: 'Belki Yarın ⏳', color: '#F59E0B', weight: 1, active: true },
      { text: 'İç sesini dinle 💭', color: '#6366F1', weight: 1, active: true },
      { text: 'Yeniden Çevir 🔄', color: '#8B5CF6', weight: 1, active: true },
      { text: 'Arkadaşına Sor 👥', color: '#EC4899', weight: 1, active: true }
    ]
  },
  {
    id: 'prizes',
    name: 'Ödül & Çekiliş Çarkı 🎁',
    description: 'Yarışmalar, yayınlar ve hediyeler için şans çarkı.',
    items: [
      { text: '%10 İndirim 🏷️', color: '#3B82F6', weight: 3, active: true },
      { text: '%25 İndirim 🎉', color: '#10B981', weight: 2, active: true },
      { text: 'Büyük Ödül 🏆', color: '#F59E0B', weight: 1, active: true },
      { text: 'Ücretsiz Kargo 📦', color: '#8B5CF6', weight: 3, active: true },
      { text: 'Pas Geçtin 😢', color: '#6B7280', weight: 2, active: true },
      { text: '%50 Süper Fırsat 🚀', color: '#EF4444', weight: 1, active: true },
      { text: 'Sürpriz Kutu 🎁', color: '#EC4899', weight: 2, active: true },
      { text: 'Tekrar Döndür 🔁', color: '#14B8A6', weight: 2, active: true }
    ]
  },
  {
    id: 'weekend',
    name: 'Hafta Sonu Ne Yapsak? 🏄‍♂️',
    description: 'Boş zamanını keyifli aktivitelere dönüştür.',
    items: [
      { text: 'Sinema & Mısır 🍿', color: '#E63946', weight: 1, active: true },
      { text: 'Doğa Yürüyüşü / Kamp 🌲', color: '#2A9D8F', weight: 1, active: true },
      { text: 'Sürükleyici Kitap Oku 📖', color: '#E76F51', weight: 1, active: true },
      { text: 'Video Oyunu Gecesi 🎮', color: '#7209B7', weight: 1, active: true },
      { text: 'Kahve & Sohbet ☕', color: '#A0522D', weight: 1, active: true },
      { text: 'Yeni Yemek Tarifi Yap 👨‍🍳', color: '#F4A261', weight: 1, active: true },
      { text: 'Bisiklet / Koşu 🚴‍♂️', color: '#457B9D', weight: 1, active: true },
      { text: 'Tüm Gün Dinlen 🛋️', color: '#588157', weight: 1, active: true }
    ]
  },
  {
    id: 'numbers',
    name: 'Şanslı Rakamlar (1 - 8) 🔢',
    description: 'Kura ve sıra belirleme için numaralar.',
    items: [
      { text: '1 Numaralı 🥇', color: '#E63946', weight: 1, active: true },
      { text: '2 Numaralı 🥈', color: '#F77F00', weight: 1, active: true },
      { text: '3 Numaralı 🥉', color: '#FCBF49', weight: 1, active: true },
      { text: '4 Numaralı 🎯', color: '#2A9D8F', weight: 1, active: true },
      { text: '5 Numaralı 🚀', color: '#3A86FF', weight: 1, active: true },
      { text: '6 Numaralı 💎', color: '#8338EC', weight: 1, active: true },
      { text: '7 Numaralı 🍀', color: '#06D6A0', weight: 1, active: true },
      { text: '8 Numaralı 🌟', color: '#FF006E', weight: 1, active: true }
    ]
  }
];
