import type { TodCard, TodLevel, TodParty, TodType } from '../types/game'

export const TOD_LEVELS: {
  id: TodLevel
  emoji: string
  title: string
  blurb: string
  adult: boolean
  accent: string
}[] = [
  { id: 'soft', emoji: '🧸', title: 'SOFT', blurb: 'Doux, safe, on se chauffe à peine.', adult: false, accent: '#38BDF8' },
  { id: 'fun', emoji: '🥳', title: 'FUN', blurb: 'Léger, absurde, personne ne crie.', adult: false, accent: '#FFD700' },
  { id: 'hot', emoji: '🔥', title: 'HOT', blurb: 'Crush, secrets, un peu trop sincère.', adult: false, accent: '#FF69B4' },
  { id: 'hard', emoji: '😈', title: 'HARD', blurb: 'Osé. 18+ et consentement.', adult: true, accent: '#8B5CF6' },
  { id: 'extreme', emoji: '🖤', title: 'EXTREME', blurb: 'Sans filtre. Limites claires, veto ok.', adult: true, accent: '#111111' },
  {
    id: 'spice',
    emoji: '🌶️',
    title: 'PIMENT',
    blurb: 'Pour pimenter la baise. 18+, consentement, veto.',
    adult: true,
    accent: '#BE123C',
  },
  { id: 'custom', emoji: '✍️', title: 'VOS DÉFIS', blurb: 'Vous écrivez. On pioche là-dedans.', adult: false, accent: '#FFFFFF' },
]

export const TOD_PARTIES: {
  id: TodParty
  emoji: string
  title: string
  blurb: string
}[] = [
  { id: 'friends', emoji: '👥', title: 'Entre amis', blurb: 'Le groupe, les potes, le roast tendre.' },
  { id: 'couples', emoji: '💑', title: 'Entre couples', blurb: 'À deux. Regard, malaise, proximité.' },
]

export const REFUSE_GAGES_MALE = [
  '15 pompes. Tu commentes comme si c’était la finale.',
  'Le groupe invente ta catchphrase. Tu la dis à chaque prise de parole.',
]

export const REFUSE_GAGES = [
  'Bois une gorgée — ou un shot de jus.',
  '10 squats en chantant.',
]

export const REFUSE_GAGES_FEMALE = [
  '15 squats en racontant ton dernier plan un peu flou.',
  'Fais ton meilleur “je suis pas jalouse” en 20 secondes.',
]

function card(
  id: string,
  level: TodLevel,
  party: TodParty,
  type: TodType,
  content: string,
  intensity: number,
  forGender: TodCard['forGender'] = 'any',
  withGender: TodCard['withGender'] = 'any',
  playerCount?: TodCard['playerCount'],
  extras?: { duration?: number; intimate?: boolean },
): TodCard {
  const count = playerCount ?? (party === 'couples' || content.includes('{other}') ? 'couple' : 'solo')
  const intimateLevels = level === 'hot' || level === 'hard' || level === 'extreme' || level === 'spice'
  return {
    id,
    level,
    party,
    type,
    content,
    intensity,
    forGender,
    withGender,
    playerCount: count,
    duration: extras?.duration,
    intimate: extras?.intimate ?? (intimateLevels && type === 'dare' && count === 'couple'),
    adult: level === 'hard' || level === 'extreme' || level === 'spice',
  }
}

export const TOD_CARDS: TodCard[] = [
  // SOFT × FRIENDS
  card('sf1', 'soft', 'friends', 'truth', 'Quelle chanson honteuse tu connais encore par cœur ?', 1),
  card('sf2', 'soft', 'friends', 'dare', 'Fais ton meilleur rire de méchant. Personne ne doit rire.', 1),
  card('sf3', 'soft', 'friends', 'truth', 'Quel est ton talent caché le plus inutile ?', 1),
  card('sf4', 'soft', 'friends', 'dare', 'Parle comme un GPS jusqu’à la fin du tour.', 2),
  card('sf5', 'soft', 'friends', 'truth', 'Si tu étais un plat, tu serais quoi ?', 2),
  card('sf6', 'soft', 'friends', 'dare', 'Imite {other} jusqu’à ce que le groupe trouve qui c’est.', 2),
  card('sf7', 'soft', 'friends', 'truth', 'Qui ferait le pire colocataire ici, avec amour ?', 2, 'any', 'any', 'group'),
  card('sf8', 'soft', 'friends', 'dare', 'Fais un défilé avec un objet de la pièce.', 2),
  card('sf9', 'soft', 'friends', 'truth', 'Quelle appli tu ouvres trop, honnêtement ?', 1),
  card('sf10', 'soft', 'friends', 'dare', 'Inventer un slogan pub pour {other}.', 2),

  // SOFT × COUPLES
  card('sc1', 'soft', 'couples', 'truth', 'Quel est le truc le plus niais que tu aimes chez {other} ?', 1),
  card('sc2', 'soft', 'couples', 'dare', 'Inventer une handshake secrète avec {other}.', 1),
  card('sc3', 'soft', 'couples', 'truth', 'Si vous étiez un duo de film, vous seriez qui ?', 1),
  card('sc4', 'soft', 'couples', 'dare', 'Fais un toast ridicule à {other}, 10 secondes.', 2),
  card('sc5', 'soft', 'couples', 'dare', 'Laisse {other} te coiffer n’importe comment.', 2),
  card('sc6', 'soft', 'couples', 'truth', 'Quelle chanson serait votre générique ?', 1),
  card('sc7', 'soft', 'couples', 'dare', 'Regarde {other} 8 secondes sans rire.', 2),
  card('sc8', 'soft', 'couples', 'truth', 'Qui de vous deux perdrait aux cartes ?', 1),

  // FUN × FRIENDS
  card('ff1', 'fun', 'friends', 'truth', 'Quel surnom humiliant on t’a déjà collé ?', 2),
  card('ff2', 'fun', 'friends', 'dare', 'Danse 12 secondes sans musique. Le groupe note sur 10.', 3),
  card('ff3', 'fun', 'friends', 'truth', 'Quelle est la théorie du complot la plus pourrie à laquelle tu as presque cru ?', 2),
  card('ff4', 'fun', 'friends', 'dare', 'Marche comme un mannequin outré sur un tapis imaginaire.', 3),
  card('ff5', 'fun', 'friends', 'truth', 'Si tu étais un plat, tu serais quoi — et qui ici te mangerait ?', 3, 'any', 'any', 'group'),
  card('ff6', 'fun', 'friends', 'dare', 'Imite un animal choisi par {other} pendant 20 secondes.', 3),
  card('ff7', 'fun', 'friends', 'truth', 'Qui ferait le pire colocataire ici, et pourquoi (avec amour) ?', 3, 'any', 'any', 'group'),
  card('ff8', 'fun', 'friends', 'dare', 'Raconte une blague nulle. Si personne ne rit, tu recommences.', 3),
  card('ff9', 'fun', 'friends', 'truth', 'Quel surnom humiliant on t’a déjà collé ?', 2),
  card('ff10', 'fun', 'friends', 'dare', 'Danse 12 secondes sans musique. Le groupe note sur 10.', 3),
  card('ff11', 'fun', 'friends', 'dare', 'Inventer un slogan pub pour {other}.', 3),
  card('ff12', 'fun', 'friends', 'truth', 'Quelle appli tu ouvres trop, honnêtement ?', 2),
  card('ff13', 'fun', 'friends', 'dare', 'Fais ton entrée de catch. Nom de scène obligatoire.', 3, 'male'),
  card('ff14', 'fun', 'friends', 'dare', 'Monologue de série : “Dans cette maison, on…”.', 3, 'female'),
  card('ff15', 'fun', 'friends', 'truth', 'Qui a le plus de chances de devenir célèbre — ou d’être arrêté pour une blague ?', 3, 'any', 'any', 'group'),

  // FUN × COUPLES
  card('fc1', 'fun', 'couples', 'truth', 'Quel est le truc le plus niais que tu aimes chez {other} ?', 2),
  card('fc2', 'fun', 'couples', 'dare', 'Inventer une handshake secrète avec {other}.', 2),
  card('fc3', 'fun', 'couples', 'truth', 'Si vous étiez un duo de film, vous seriez qui ?', 2),
  card('fc4', 'fun', 'couples', 'dare', 'Fais un toast ridicule à {other}, 10 secondes.', 3),
  card('fc5', 'fun', 'couples', 'dare', 'Laisse {other} te coiffer n’importe comment.', 3),
  card('fc6', 'fun', 'couples', 'truth', 'Quelle chanson serait votre générique de couple ?', 2),
  card('fc7', 'fun', 'couples', 'dare', 'Regarde {other} 8 secondes sans rire.', 3),
  card('fc8', 'fun', 'couples', 'dare', 'Imite {other} qui rentre à la maison. Iel juge.', 3),
  card('fc9', 'fun', 'couples', 'truth', 'Quel surnom tu n’oserais jamais lui donner… sauf maintenant ?', 3),
  card('fc10', 'fun', 'couples', 'dare', 'Portrait chinois de {other} : animal, plat, météo.', 3),
  card('fc11', 'fun', 'couples', 'dare', 'Danse 10 secondes avec {other}, sans musique.', 3),
  card('fc12', 'fun', 'couples', 'truth', 'Qui de vous deux perdrait aux cartes — et tricherait ?', 2),

  // HOT × FRIENDS
  card('hf1', 'hot', 'friends', 'truth', 'Qui ici tu trouves le plus attirant, sans te justifier ?', 6, 'any', 'any', 'group'),
  card('hf2', 'hot', 'friends', 'truth', 'As-tu déjà menti à quelqu’un dans cette pièce ? Sur quoi ?', 6, 'any', 'any', 'group'),
  card('hf3', 'hot', 'friends', 'dare', 'Fais un compliment un peu trop sincère à {other}.', 4),
  card('hf4', 'hot', 'friends', 'truth', 'Quel est ton plus gros flop en drague ?', 5),
  card('hf5', 'hot', 'friends', 'truth', 'Tu as déjà stalké un ex cette année ?', 5),
  card('hf6', 'hot', 'friends', 'dare', 'Écris un message de drague à {other}, lis-le, ne l’envoie pas.', 5),
  card('hf7', 'hot', 'friends', 'truth', 'Qui ici a le plus de game, selon toi ?', 4, 'any', 'any', 'group'),
  card('hf8', 'hot', 'friends', 'dare', 'Montre tes 5 dernières photos. 3 secondes pour crop mentalement.', 5),
  card('hf9', 'hot', 'friends', 'truth', 'Où est l’endroit le plus improbable où tu as déjà embrassé ?', 6),
  card('hf10', 'hot', 'friends', 'dare', 'Le groupe pose 3 questions oui/non. Tu réponds aux 3.', 5, 'any', 'any', 'group'),
  card('hf11', 'hot', 'friends', 'truth', 'Raconte le plus gros mensonge que tu as sorti pour paraître intéressant.', 5, 'male'),
  card('hf12', 'hot', 'friends', 'truth', 'Tu as déjà ghosté quelqu’un par politesse. Contexte.', 5, 'female'),
  card('hf13', 'hot', 'friends', 'dare', 'Sors ta pire punchline à {other}. Note sur 10.', 5, 'male'),
  card('hf14', 'hot', 'friends', 'dare', 'Dis à {other} ce qui te plairait, version PG, 8 secondes.', 5, 'female'),
  card('hf15', 'hot', 'friends', 'truth', 'Qui ici te ferait changer d’avis sur “je sors avec personne” ?', 6, 'any', 'any', 'group'),

  // HOT × COUPLES
  card('hc1', 'hot', 'couples', 'truth', 'Quand tu as su que {other} n’était pas “juste un pote” ?', 5),
  card('hc2', 'hot', 'couples', 'dare', 'Chuchote à {other} un compliment que tu gardes d’habitude.', 5),
  card('hc3', 'hot', 'couples', 'truth', 'Quel geste de {other} te fait craquer, même en public ?', 5),
  card('hc4', 'hot', 'couples', 'dare', 'Assieds-toi face à {other} et fais un compliment en 3 mots.', 4),
  card('hc5', 'hot', 'couples', 'dare', 'Tient la main de {other} jusqu’au prochain tour.', 4),
  card('hc6', 'hot', 'couples', 'truth', 'Vous, c’est slow burn ou plan assumé ?', 4),
  card('hc7', 'hot', 'couples', 'dare', 'Fais ton “regard de film” à {other}.', 4),
  card('hc8', 'hot', 'couples', 'truth', 'Quelle jalousie tu n’as jamais avouée à {other} ?', 6),
  card('hc9', 'hot', 'couples', 'dare', 'Massage des épaules de {other}, 20 secondes, silence.', 5),
  card('hc10', 'hot', 'couples', 'dare', 'Bisou sur la joue ou la main de {other} — iel choisit.', 6),
  card('hc11', 'hot', 'couples', 'truth', 'Où tu aimes qu’on t’embrasse, hors lèvres ?', 6),
  card('hc12', 'hot', 'couples', 'dare', 'Écris en 15 secondes pourquoi {other} te plaît. Lis.', 5),

  // HARD × FRIENDS
  card('df1', 'hard', 'friends', 'truth', 'Qui ici tu embrasserais s’il ne restait que cette pièce ?', 8, 'any', 'any', 'group'),
  card('df2', 'hard', 'friends', 'truth', 'Quelle fantaisie tu n’as jamais avouée au groupe ?', 8),
  card('df3', 'hard', 'friends', 'dare', 'Le groupe écrit une phrase osée. Tu la lis à {other}.', 8),
  card('df4', 'hard', 'friends', 'truth', 'As-tu déjà envoyé un nude ? Contexte, pas le PNG.', 8),
  card('df5', 'hard', 'friends', 'truth', 'Tu es plutôt dominant, soumis, ou selon l’humeur ?', 8),
  card('df6', 'hard', 'friends', 'dare', 'Chuchote à {other} ce que tu penses d’iel… version hot.', 7),
  card('df7', 'hard', 'friends', 'truth', 'Quel est ton plus gros turn-on et ton plus gros turn-off ?', 7),
  card('df8', 'hard', 'friends', 'dare', 'Assieds-toi contre {other} jusqu’au prochain tour.', 6),
  card('df9', 'hard', 'friends', 'truth', 'Qui ici a le plus de “je sais exactement ce que je fais” ?', 7, 'any', 'any', 'group'),
  card('df10', 'hard', 'friends', 'truth', 'Décris ta dernière fois sans donner de nom… ou assume.', 8, 'male'),
  card('df11', 'hard', 'friends', 'truth', 'La chose la plus osée que tu aies faite par défi ?', 8, 'female'),
  card('df12', 'hard', 'friends', 'dare', 'Inventer une règle osée pour {other} au prochain tour. Veto ok.', 7),
  card('df13', 'hard', 'friends', 'dare', 'Slow de 15 secondes avec {other}. Le groupe se tait.', 7),
  card('df14', 'hard', 'friends', 'dare', 'Décris {other} en 4 mots, version désir, pas version pote.', 7),

  // HARD × COUPLES
  card('dc1', 'hard', 'couples', 'truth', 'Quelle envie tu n’as encore jamais dite à {other} ?', 8),
  card('dc2', 'hard', 'couples', 'dare', 'Chuchote à {other} où tu l’embrasserais s’il n’y avait personne.', 8),
  card('dc3', 'hard', 'couples', 'truth', 'Tu dragues plutôt avec les mots, les mains, ou le silence ?', 7, 'male'),
  card('dc4', 'hard', 'couples', 'truth', 'Tu préfères qu’on te poursuive un peu, ou que ce soit cash ?', 7, 'female'),
  card('dc5', 'hard', 'couples', 'dare', 'Slow de 20 secondes avec {other}.', 7),
  card('dc6', 'hard', 'couples', 'dare', 'Dis à {other} une chose sexy chez iel — hors physique.', 7),
  card('dc7', 'hard', 'couples', 'truth', 'Où tu veux les mains de {other}, honnêtement ?', 8),
  card('dc8', 'hard', 'couples', 'dare', 'Bisou où {other} le décide. 3 secondes.', 8),
  card('dc9', 'hard', 'couples', 'truth', 'Quelle limite vous n’avez pas encore croisée — et tu veux ?', 8),
  card('dc10', 'hard', 'couples', 'dare', 'Massage lent, 30 secondes, yeux dans les yeux.', 7),
  card('dc11', 'hard', 'couples', 'dare', 'Inventer une règle osée pour ce soir. {other} peut veto.', 8),
  card('dc12', 'hard', 'couples', 'truth', 'Raconte un moment où tu as vraiment voulu {other}, au mauvais moment.', 8),

  // EXTREME × FRIENDS
  card('ef1', 'extreme', 'friends', 'truth', 'Qui ici tu prendrais pour une nuit, sans te justifier ?', 10, 'any', 'any', 'group'),
  card('ef2', 'extreme', 'friends', 'dare', 'Chuchote à {other} exactement ce que tu ferais s’il n’y avait plus personne.', 9),
  card('ef3', 'extreme', 'friends', 'truth', 'Quelle limite tu as déjà franchie et que tu referais ?', 9),
  card('ef4', 'extreme', 'friends', 'dare', 'Le groupe invente un défi osé. Tu le fais ou tu prends le gage.', 9, 'any', 'any', 'group'),
  card('ef5', 'extreme', 'friends', 'truth', 'Décris ton plus gros “j’aurais pas dû” — version cash.', 9),
  card('ef6', 'extreme', 'friends', 'dare', 'Assieds-toi sur les genoux de {other} jusqu’au prochain tour.', 9),
  card('ef7', 'extreme', 'friends', 'truth', 'Qui ici tu veux trop, et depuis quand ?', 10, 'any', 'any', 'group'),
  card('ef8', 'extreme', 'friends', 'dare', 'Fais à {other} ce que le groupe vote : regard, main, ou phrase.', 9),

  // EXTREME × COUPLES
  card('ec1', 'extreme', 'couples', 'truth', 'Quelle envie tu n’as jamais dite à {other} parce que c’était “trop” ?', 10),
  card('ec2', 'extreme', 'couples', 'dare', 'Dis à {other} précisément où tu le/la veux, maintenant.', 10),
  card('ec3', 'extreme', 'couples', 'truth', 'Vous, c’est quoi le non-négociable au lit — et le fantasme caché ?', 10),
  card('ec4', 'extreme', 'couples', 'dare', 'Guide les mains de {other} 20 secondes. Le groupe compte.', 9),
  card('ec5', 'extreme', 'couples', 'dare', 'Bisou où {other} décide. Pas la joue.', 10),
  card('ec6', 'extreme', 'couples', 'truth', 'Quelle règle vous pourriez casser ce soir ?', 9),
  card('ec7', 'extreme', 'couples', 'dare', 'Chuchote à {other} ta phrase la plus sale. Une seule.', 10),
  card('ec8', 'extreme', 'couples', 'truth', 'Si on vous laisse seuls 10 minutes, vous faites quoi — cash.', 10),

  // SPICE × FRIENDS — pour pimenter la baise (groupe)
  card('pf1', 'spice', 'friends', 'truth', 'Qui ici tu baiserais ce soir, sans te justifier ?', 10, 'any', 'any', 'group'),
  card('pf2', 'spice', 'friends', 'dare', 'Chuchote à {other} exactement comment tu le/la baiserais.', 10),
  card('pf3', 'spice', 'friends', 'truth', 'Quelle position tu veux trop tester — et avec qui ici ?', 10, 'any', 'any', 'group'),
  card('pf4', 'spice', 'friends', 'dare', 'Décris le corps de {other} comme si tu le déshabillais. Lentement.', 9),
  card('pf5', 'spice', 'friends', 'truth', 'Tu préfères être pris.e fort, ou te faire supplier ?', 10),
  card('pf6', 'spice', 'friends', 'dare', 'Assieds-toi sur les genoux de {other} et bouge 10 secondes. Le groupe se tait.', 10),
  card('pf7', 'spice', 'friends', 'truth', 'Quel bruit / mot pendant le sexe te fait craquer ?', 9),
  card('pf8', 'spice', 'friends', 'dare', 'Embrasse le cou de {other} 5 secondes. Ou gage.', 10),
  card('pf9', 'spice', 'friends', 'truth', 'As-tu déjà baisé en pensant à quelqu’un dans cette pièce ?', 10, 'any', 'any', 'group'),
  card('pf10', 'spice', 'friends', 'dare', 'Le groupe vote une règle “au lit” pour {other} ce soir. Veto ok.', 9),
  card('pf11', 'spice', 'friends', 'truth', 'Où tu aimes qu’on te touche en premier — cash.', 9, 'female'),
  card('pf12', 'spice', 'friends', 'truth', 'Tu dure combien… et tu bluffes combien ?', 9, 'male'),

  // SPICE × COUPLES — pour pimenter la baise
  card('pc1', 'spice', 'couples', 'truth', 'Quelle envie sexuelle tu n’as jamais dite à {other} ?', 10),
  card('pc2', 'spice', 'couples', 'dare', 'Dis à {other} exactement comment tu veux être baisé.e ce soir.', 10),
  card('pc3', 'spice', 'couples', 'truth', 'Quelle position vous n’avez pas encore essayée — et qui veut la tenter ?', 10),
  card('pc4', 'spice', 'couples', 'dare', 'Guide les mains de {other} sous tes vêtements 15 secondes. Le groupe compte.', 10),
  card('pc5', 'spice', 'couples', 'dare', 'Embrasse {other} comme si vous étiez seuls. 8 secondes.', 10),
  card('pc6', 'spice', 'couples', 'truth', 'Tu veux plus de domination, de lenteur, ou de saleté — ce soir ?', 10),
  card('pc7', 'spice', 'couples', 'dare', 'Chuchote à {other} ta phrase la plus sale. Une seule. Puis bisou.', 10),
  card('pc8', 'spice', 'couples', 'truth', 'Où tu veux la bouche de {other} en premier ?', 10),
  card('pc9', 'spice', 'couples', 'dare', 'Fais à {other} ce qu’iel demande pendant 20 secondes. Veto = gage.', 10),
  card('pc10', 'spice', 'couples', 'truth', 'Quel “piment” vous pourriez ajouter ce soir sans vous forcer ?', 9),
  card('pc11', 'spice', 'couples', 'dare', 'Massage très bas du dos de {other}, 30 secondes, silence.', 9),
  card('pc12', 'spice', 'couples', 'truth', 'Si on vous laisse la pièce 10 minutes, vous faites quoi — cash.', 10),

  // Timed challenges (mix levels)
  card('tm1', 'soft', 'friends', 'dare', 'Fais 15 squats en {duration} secondes.', 2, 'any', 'any', 'solo', { duration: 30 }),
  card('tm2', 'soft', 'friends', 'dare', 'Tiens en équilibre sur une jambe pendant {duration} secondes.', 2, 'any', 'any', 'solo', { duration: 20 }),
  card('tm3', 'fun', 'friends', 'dare', 'Danse sans musique pendant {duration} secondes. Le groupe note.', 3, 'any', 'any', 'solo', { duration: 15 }),
  card('tm4', 'fun', 'friends', 'dare', 'Fais 20 pompes (ou genoux) en {duration} secondes.', 3, 'male', 'any', 'solo', { duration: 40 }),
  card('tm5', 'fun', 'couples', 'dare', 'Regarde {other} dans les yeux pendant {duration} secondes sans rire.', 3, 'any', 'any', 'couple', { duration: 10 }),
  card('tm6', 'hot', 'friends', 'dare', 'Complimente {other} sans pause pendant {duration} secondes.', 5, 'any', 'any', 'couple', { duration: 20 }),
  card('tm7', 'hot', 'couples', 'dare', 'Massage du cou de {other} pendant {duration} secondes.', 6, 'any', 'any', 'couple', { duration: 30, intimate: true }),
  card('tm8', 'hot', 'couples', 'dare', 'Tiens la main de {other} pendant {duration} secondes, silence.', 5, 'any', 'any', 'couple', { duration: 25, intimate: true }),
  card('tm9', 'hard', 'couples', 'dare', 'Embrasse la joue de {other} et maintiens {duration} secondes.', 8, 'any', 'any', 'couple', { duration: 5, intimate: true }),
  card('tm10', 'hard', 'couples', 'dare', 'Câlin collé à {other} pendant {duration} secondes.', 8, 'any', 'any', 'couple', { duration: 15, intimate: true }),
  card('tm11', 'extreme', 'couples', 'dare', 'Slow collé avec {other} pendant {duration} secondes.', 9, 'any', 'any', 'couple', { duration: 20, intimate: true }),
  card('tm12', 'spice', 'couples', 'dare', 'Guide les mains de {other} pendant {duration} secondes. Veto ok.', 10, 'any', 'any', 'couple', { duration: 20, intimate: true }),
  card('tm13', 'fun', 'friends', 'truth', 'Réponds sans détour en moins de {duration} secondes : ton crush secret ici ?', 4, 'any', 'any', 'group', { duration: 15 }),
  card('tm14', 'soft', 'friends', 'dare', 'Imite un animal choisi par le groupe pendant {duration} secondes.', 2, 'any', 'any', 'solo', { duration: 12 }),
]

export function fillTemplate(content: string, name: string, other?: string, duration?: number) {
  return content
    .replaceAll('{name}', name)
    .replaceAll('{other}', other ?? 'quelqu’un')
    .replaceAll('{target}', other ?? 'quelqu’un')
    .replaceAll('{duration}', duration != null ? String(duration) : '30')
}

export function cardsFor(level: TodLevel, party: TodParty) {
  return TOD_CARDS.filter((item) => item.level === level && item.party === party)
}
