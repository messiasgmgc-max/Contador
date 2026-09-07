export interface IPhoneModel {
  id: string;
  name: string;
  series: 'iPhone 16' | 'iPhone 15' | 'iPhone 14' | 'iPhone 13' | 'Outros';
  tagline: string;
  startingPrice: number;
  image: string;
  badge?: string;
  specs: {
    screen: string;
    chip: string;
    camera: string;
    battery: string;
  };
  storageOptions: { size: string; price: number }[];
  colors: { name: string; hex: string }[];
  condition: 'Novo Lacrado' | 'Seminovo Impecável';
}

export const IPHONES_DATA: IPhoneModel[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    series: 'iPhone 16',
    tagline: 'O ápice da tecnologia Apple com Titânio e Apple Intelligence.',
    startingPrice: 9499,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    badge: 'Lançamento',
    specs: {
      screen: 'Super Retina XDR OLED 6.9" 120Hz ProMotion',
      chip: 'A18 Pro (3nm de última geração)',
      camera: 'Sistema Fusion 48 MP + Ultra-Angular 48 MP + Telefoto 5x',
      battery: 'Até 33 horas de reprodução de vídeo',
    },
    storageOptions: [
      { size: '256 GB', price: 9499 },
      { size: '512 GB', price: 10899 },
      { size: '1 TB', price: 12299 },
    ],
    colors: [
      { name: 'Titânio Preto', hex: '#2b2b2d' },
      { name: 'Titânio Deserto', hex: '#c5b49f' },
      { name: 'Titânio Natural', hex: '#9d9990' },
      { name: 'Titânio Branco', hex: '#f2f1ed' },
    ],
    condition: 'Novo Lacrado',
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    series: 'iPhone 16',
    tagline: 'Poder absoluto e controle de câmera avançado no tamanho ideal.',
    startingPrice: 8399,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    badge: 'Alta Procura',
    specs: {
      screen: 'Super Retina XDR OLED 6.3" 120Hz ProMotion',
      chip: 'A18 Pro com GPU de 6 núcleos',
      camera: 'Pro 48 MP + Ultra-Wide 48 MP + Telefoto 5x',
      battery: 'Até 27 horas de reprodução de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 8399 },
      { size: '256 GB', price: 8999 },
      { size: '512 GB', price: 10299 },
    ],
    colors: [
      { name: 'Titânio Preto', hex: '#2b2b2d' },
      { name: 'Titânio Deserto', hex: '#c5b49f' },
      { name: 'Titânio Natural', hex: '#9d9990' },
      { name: 'Titânio Branco', hex: '#f2f1ed' },
    ],
    condition: 'Novo Lacrado',
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    series: 'iPhone 16',
    tagline: 'Cores vibrantes, botão de Ação e Controle da Câmera integrados.',
    startingPrice: 5999,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    badge: 'Novidade',
    specs: {
      screen: 'Super Retina XDR OLED 6.1" com Ceramic Shield',
      chip: 'A18 Bionic ultraveloz',
      camera: 'Dupla avançada 48 MP Fusion + Ultra-Angular',
      battery: 'Até 22 horas de reprodução de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 5999 },
      { size: '256 GB', price: 6699 },
      { size: '512 GB', price: 7999 },
    ],
    colors: [
      { name: 'Preto', hex: '#1c1d1f' },
      { name: 'Rosa', hex: '#f4b8cf' },
      { name: 'Verde-Acizentado', hex: '#bfe1d9' },
      { name: 'Azul-Ultramarino', hex: '#779bc9' },
      { name: 'Branco', hex: '#fafafa' },
    ],
    condition: 'Novo Lacrado',
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    series: 'iPhone 15',
    tagline: 'Estrutura inovadora em Titânio e zoom óptico de 5x.',
    startingPrice: 6899,
    image: 'https://images.unsplash.com/photo-1695048065053-9366114bca81?auto=format&fit=crop&w=800&q=80',
    badge: 'Custo-Benefício Premium',
    specs: {
      screen: 'Super Retina XDR OLED 6.7" ProMotion',
      chip: 'A17 Pro com Ray Tracing acelerado por hardware',
      camera: '48 MP Principal + Telefoto 5x + Ultra-Angular',
      battery: 'Até 29 horas de vídeo',
    },
    storageOptions: [
      { size: '256 GB', price: 6899 },
      { size: '512 GB', price: 7899 },
      { size: '1 TB', price: 8999 },
    ],
    colors: [
      { name: 'Titânio Natural', hex: '#9d9990' },
      { name: 'Titânio Azul', hex: '#2f3b4c' },
      { name: 'Titânio Preto', hex: '#2b2b2d' },
      { name: 'Titânio Branco', hex: '#f2f1ed' },
    ],
    condition: 'Seminovo Impecável',
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    series: 'iPhone 15',
    tagline: 'Desempenho profissional incomparável em titânio aeroespacial.',
    startingPrice: 5899,
    image: 'https://images.unsplash.com/photo-1695048065053-9366114bca81?auto=format&fit=crop&w=800&q=80',
    badge: 'Mais Vendido',
    specs: {
      screen: 'Super Retina XDR OLED 6.1" ProMotion',
      chip: 'A17 Pro potente',
      camera: 'Sistema Pro 48 MP com 7 distâncias focais',
      battery: 'Até 23 horas de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 5899 },
      { size: '256 GB', price: 6399 },
      { size: '512 GB', price: 7299 },
    ],
    colors: [
      { name: 'Titânio Natural', hex: '#9d9990' },
      { name: 'Titânio Preto', hex: '#2b2b2d' },
      { name: 'Titânio Azul', hex: '#2f3b4c' },
      { name: 'Titânio Branco', hex: '#f2f1ed' },
    ],
    condition: 'Seminovo Impecável',
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    series: 'iPhone 15',
    tagline: 'Dynamic Island, câmera principal de 48 MP e conexão USB-C.',
    startingPrice: 4499,
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
    specs: {
      screen: 'Super Retina XDR OLED 6.1" com Dynamic Island',
      chip: 'A16 Bionic',
      camera: '48 MP Principal com Telefoto 2x integrado',
      battery: 'Até 20 horas de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 4499 },
      { size: '256 GB', price: 4999 },
      { size: '512 GB', price: 5899 },
    ],
    colors: [
      { name: 'Preto', hex: '#1c1d1f' },
      { name: 'Azul Claro', hex: '#d0e0eb' },
      { name: 'Verde Claro', hex: '#d7ebd9' },
      { name: 'Rosa Pastel', hex: '#f7d8df' },
      { name: 'Amarelo', hex: '#fbeecc' },
    ],
    condition: 'Novo Lacrado',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    series: 'iPhone 14',
    tagline: 'A estreia da Dynamic Island e câmera revolucionária de 48 MP.',
    startingPrice: 5299,
    image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=800&q=80',
    badge: 'Destaque Seminovo',
    specs: {
      screen: 'Super Retina XDR OLED 6.7" Tela Sempre Ativa',
      chip: 'A16 Bionic de 6 núcleos',
      camera: '48 MP com modo Cinema em 4K HDR',
      battery: 'Até 29 horas de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 5299 },
      { size: '256 GB', price: 5799 },
      { size: '512 GB', price: 6599 },
    ],
    colors: [
      { name: 'Roxo Profundo', hex: '#483c4f' },
      { name: 'Preto-Espacial', hex: '#1d1d1f' },
      { name: 'Prateado', hex: '#e2e4e1' },
      { name: 'Dourado', hex: '#f7e8ce' },
    ],
    condition: 'Seminovo Impecável',
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    series: 'iPhone 14',
    tagline: 'Grande autonomia de bateria e fotos incríveis em pouca luz.',
    startingPrice: 3699,
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=800&q=80',
    specs: {
      screen: 'Super Retina XDR OLED 6.1"',
      chip: 'A15 Bionic com GPU de 5 núcleos',
      camera: 'Dupla de 12 MP com Photonic Engine',
      battery: 'Até 20 horas de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 3699 },
      { size: '256 GB', price: 4199 },
    ],
    colors: [
      { name: 'Meia-Noite', hex: '#191f28' },
      { name: 'Estelar', hex: '#f0ece3' },
      { name: 'Azul', hex: '#9eb4cf' },
      { name: 'Roxo Claro', hex: '#e5d7eb' },
      { name: 'Vermelho (PRODUCT)RED', hex: '#d1152a' },
    ],
    condition: 'Seminovo Impecável',
  },
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    series: 'iPhone 13',
    tagline: 'O campeão imbatível em custo e performance para o dia a dia.',
    startingPrice: 2899,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80',
    badge: 'Mais Acessível',
    specs: {
      screen: 'Super Retina XDR OLED 6.1"',
      chip: 'A15 Bionic veloz e econômico',
      camera: 'Dupla de 12 MP com estabilização por deslocamento de sensor',
      battery: 'Até 19 horas de vídeo',
    },
    storageOptions: [
      { size: '128 GB', price: 2899 },
      { size: '256 GB', price: 3299 },
    ],
    colors: [
      { name: 'Meia-Noite', hex: '#191f28' },
      { name: 'Estelar', hex: '#f0ece3' },
      { name: 'Verde', hex: '#314436' },
      { name: 'Rosa', hex: '#f9d5d8' },
      { name: 'Azul', hex: '#275270' },
    ],
    condition: 'Seminovo Impecável',
  }
];
