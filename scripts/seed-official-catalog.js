const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COLLECTIONS = [
  {
    name: 'Tita Merello',
    bio: 'Cantante, actriz y símbolo indiscutido de la cultura popular argentina. Dueña de un estilo inconfundible y una voz que desafió las convenciones de su época.',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/tita-popart-blanca.jpg'
  },
  {
    name: 'Paquita Bernardo',
    bio: 'La primera mujer bandoneonista profesional de la historia del tango (1900-1925). Audaz, virtuosa y popular, derribó la hegemonía del instrumento.',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/paquita-bernardo-blanca.jpg'
  },
  {
    name: "Eloísa D'Herbil",
    bio: "La primera mujer compositora de tangos (1842-1943), con más de 100 obras. Dama aristocrática que venció la prohibición del tango en su medio social.",
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/baronesa-eloisa-negra.jpg'
  },
  {
    name: 'Rosita Quiroga',
    bio: 'Cantante y compositora (1896-1984), primera mujer que cantó tangos en la radiofonía argentina. De estilo reo y pionera en llevar el tango a Japón.',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/rosita-quiroga-blanca.jpg'
  },
  {
    name: 'Fermina Maristany',
    bio: 'Pianista, acordeonista, bandoneonista y directora de orquesta (1897-1985). Una música arrolladora que conquistó Barracas y los escenarios porteños.',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/fermina-maristany-negra.jpg'
  },
  {
    name: 'Nina Miranda',
    bio: 'Una de las grandes voces del Río de la Plata (1925-2012). Brilló en la época dorada con Donato Racciatti: "Su interpretación tenía algo que no enseñan en los conservatorios: ALMA".',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/nina-miranda-blanca.jpg'
  },
  {
    name: 'María Nieves',
    bio: 'Emblemática bailarina, milonguera y coreógrafa (1934-2026), referente indiscutida consagrada con el Día de la Bailarina de Tango (6 de septiembre).',
    instagram: '@mujeresdeltango',
    avatar_url: '/remeras/maria-nieves-blanca.jpg'
  }
];

const REMERAS = [
  {
    title: 'Tita Merello — Cuadrantes Pop Art',
    description: 'Diseño Pop Art en 4 cuadrantes estilo Andy Warhol con retratos de la gran Tita Merello (1904-2002). Disponible en remera blanca y negra.',
    price: 28000,
    category: 'Edición Pop Art',
    collection_name: 'Tita Merello',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco', 'Negro'],
    stock: 50,
    image_url: '/remeras/tita-popart-blanca.jpg',
    gallery_urls: ['/remeras/tita-popart-blanca.jpg', '/remeras/tita-popart-negra.jpg'],
    is_active: true
  },
  {
    title: 'Paquita Bernardo — La Bandoneonista Hereje',
    description: 'Homenaje a Paquita Bernardo (1900-1925), la primera mujer en tocar profesionalmente el bandoneón en Buenos Aires, derribando los prejuicios de su época.',
    price: 28000,
    category: 'Pioneras del Tango',
    collection_name: 'Paquita Bernardo',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco'],
    stock: 40,
    image_url: '/remeras/paquita-bernardo-blanca.jpg',
    gallery_urls: ['/remeras/paquita-bernardo-blanca.jpg'],
    is_active: true
  },
  {
    title: "La Baronesa Eloísa D'Herbil de Silva",
    description: 'Homenaje a la primera mujer compositora de tangos en la historia (1842-1943), con más de 100 obras compuestas. Dama que desafió los mandatos aristocráticos.',
    price: 28000,
    category: 'Compositoras',
    collection_name: "Eloísa D'Herbil",
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    stock: 35,
    image_url: '/remeras/baronesa-eloisa-negra.jpg',
    gallery_urls: ['/remeras/baronesa-eloisa-negra.jpg'],
    is_active: true
  },
  {
    title: 'Rosita Quiroga — Primera Voz en Radio',
    description: 'Pionera absoluta (1896-1984), primera mujer en cantar tangos en la radiofonía argentina, de estilo reo y arrabalero con gran proyección internacional.',
    price: 28000,
    category: 'Cantantes',
    collection_name: 'Rosita Quiroga',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco'],
    stock: 30,
    image_url: '/remeras/rosita-quiroga-blanca.jpg',
    gallery_urls: ['/remeras/rosita-quiroga-blanca.jpg'],
    is_active: true
  },
  {
    title: 'Fermina "La Negra" Maristany — Directora de Orquesta',
    description: 'Pianista, acordeonista, bandoneonista y directora de orquesta (1897-1985). Una música arrolladora que conquistó Barracas y los escenarios porteños.',
    price: 28000,
    category: 'Directoras & Músicas',
    collection_name: 'Fermina Maristany',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    stock: 30,
    image_url: '/remeras/fermina-maristany-negra.jpg',
    gallery_urls: ['/remeras/fermina-maristany-negra.jpg'],
    is_active: true
  },
  {
    title: 'Nina Miranda — Alma de Conservatorio',
    description: '"Su interpretación tenía algo que no enseñan en los conservatorios: ALMA" (1925-2012). Brilló en la época dorada con Donato Racciatti y Lucio Demare.',
    price: 28000,
    category: 'Grandes Voces',
    collection_name: 'Nina Miranda',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco', 'Negro'],
    stock: 45,
    image_url: '/remeras/nina-miranda-blanca.jpg',
    gallery_urls: ['/remeras/nina-miranda-blanca.jpg', '/remeras/nina-miranda-negra.jpg'],
    is_active: true
  },
  {
    title: 'Tita Merello — Sabiduría Popular',
    description: 'Retrato de Tita con sus frases más recordadas: "Me hice un vestido de prepotente para pelear la vida...", "Al machismo no lo conozco... Mi filosofía es sabiduría popular".',
    price: 28000,
    category: 'Frases Célebres',
    collection_name: 'Tita Merello',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco'],
    stock: 40,
    image_url: '/remeras/tita-frases-blanca.jpg',
    gallery_urls: ['/remeras/tita-frases-blanca.jpg'],
    is_active: true
  },
  {
    title: 'Tita Merello — Muchacha, hacete el Papanicolau',
    description: 'Diseño pop art de Tita Merello junto a su perro con su histórica frase de salud comunitaria: "Muchacha, hacete el papanicolau".',
    price: 28000,
    category: 'Edición Especial',
    collection_name: 'Tita Merello',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco', 'Amarillo'],
    stock: 50,
    image_url: '/remeras/tita-papanicolau-blanca.jpg',
    gallery_urls: ['/remeras/tita-papanicolau-blanca.jpg', '/remeras/tita-papanicolau-amarilla.jpg'],
    is_active: true
  },
  {
    title: 'María Nieves — Día de la Bailarina de Tango',
    description: 'Emblemática bailarina, milonguera y coreógrafa (1934-2026), consagrada por el Día de la Bailarina de Tango (6 de septiembre). "Cuando se toma una pareja de tango, son dos columnas vertebrales que se hacen una".',
    price: 28000,
    category: 'Bailarinas',
    collection_name: 'María Nieves',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanco', 'Negro'],
    stock: 45,
    image_url: '/remeras/maria-nieves-blanca.jpg',
    gallery_urls: ['/remeras/maria-nieves-blanca.jpg', '/remeras/maria-nieves-negra.jpg'],
    is_active: true
  }
];

async function seed() {
  console.log('--- Insertando Colecciones Reales ---');
  for (const coll of COLLECTIONS) {
    const { error } = await supabase.from('tango_collections').upsert(coll, { onConflict: 'name' });
    if (error) console.error('Error colección', coll.name, error.message);
    else console.log('✓ Colección:', coll.name);
  }

  console.log('--- Insertando Remeras Reales ---');
  for (const rem of REMERAS) {
    const { error } = await supabase.from('tango_remeras').upsert(rem, { onConflict: 'title' });
    if (error) console.error('Error remera', rem.title, error.message);
    else console.log('✓ Remera:', rem.title);
  }

  console.log('Seed completado.');
}

seed();
