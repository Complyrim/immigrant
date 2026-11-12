import type { Festival } from '../country';

type AdultText = Partial<Pick<Festival, 'title' | 'body' | 'join' | 'joinText' | 'host' | 'hostText' | 'skip' | 'skipText'>>;

/**
 * Festival text for players who are not students. Keyed `${country}:${festivalId}` (country = the JSON file name without .json).
 * Only fields whose original wording is about school appear here; the rest of the card uses the original text.
 * A few fields that implied a job (lunch break, summer job, going to work) are also neutralised, since some players may not work.
 */
export const ADULT_FESTIVAL_TEXT: Record<string, AdultText> = {
  // Australia
  "australia:grand-final-au": {
    skipText: "Your uncle sends a running commentary nobody asked for. You laugh out loud on the bus, then get on with your day.",
  },
  "australia:anzac-day-au": {
    body: "At home there are dawn services, a public holiday and Anzac biscuits in every kitchen. Here it is an ordinary day in late April.",
  },

  // Brazil
  "brazil:natal-reveillon-br": {
    body: "At home December means a late Christmas Eve supper, summer heat and New Year's Eve in white by the water. Here the streets are quiet and cold.",
    join: "Spend Christmas Eve with a Brazilian family from the community.",
    host: "Host a New Year's Eve dinner for friends who could not travel.",
  },
  "brazil:carnaval-br": {
    body: "At home the streets are full of blocos, drums and glitter, and nobody is working. Here Carnaval falls on an ordinary week this year.",
    join: "Go to the Brazilian community's Carnaval party.",
    skip: "Watch the parades on your laptop in the evening.",
    skipText: "The samba schools cross the screen while you fold the laundry. You tap the rhythm on the table anyway.",
  },
  "brazil:festa-junina-br": {
    body: "At home June means bonfires, checked shirts, quadrilha dancing and tables of corn dishes. Here it is early summer and the city is quiet.",
  },

  // Canada
  "canada:thanksgiving-ca": {
    body: "At home, Thanksgiving is the second Monday of October, with a long weekend, turkey and the leaves at their brightest. Here it is an ordinary Monday.",
    join: "Go to the Canadian community's Thanksgiving potluck.",
    skip: "Call home during the family dinner and get on with your day.",
  },
  "canada:holidays-ca": {
    body: "At home, late December means snow, family in from other provinces and a lazy Boxing Day of leftovers and hockey on television. The city is emptying out for the holidays.",
    host: "Host a holiday dinner for the friends still in town.",
  },

  // China
  "china:mid-autumn-cn": {
    body: "The Mid-Autumn Festival falls on a weekday this year. At home your family would sit together under the full moon and share mooncakes. Here you have an early start the next morning.",
    join: "Go to the Chinese community association's Mid-Autumn gathering.",
    host: "Buy mooncakes and invite your neighbours to share them.",
  },
  "china:spring-festival-cn": {
    body: "Lunar New Year falls on an ordinary week this year. At home there would be a reunion dinner, red envelopes and the whole family around one table. Here everything carries on as usual.",
    join: "Join the Lunar New Year dinner at the community center.",
    skip: "Call home during their reunion dinner and get on with your day.",
  },
  "china:dragon-boat-cn": {
    join: "Join friends from the Chinese community to make zongzi.",
    joinText: "Your first few come out lopsided, and an older woman shows you how to tie the string. You go home with a bag of them for the freezer.",
    skip: "Send a greeting to the family chat and carry on with your day.",
  },

  // Colombia
  "colombia:amor-amistad-co": {
    body: "At home September brings Amor y Amistad, with secret friend gift swaps at school, at work and in every family. Here it is an ordinary weekend in September.",
    join: "Join the Colombian community's amigo secreto.",
    joinText: "You draw a name from a paper cup and spend a week leaving small gifts for a stranger. By the reveal you have a new friend.",
    host: "Organize an amigo secreto for your building.",
    skipText: "Your phone fills with hearts from old friends. You answer every one before you start your day.",
  },
  "colombia:velitas-co": {
    body: "On the night of 7 December, people at home line the sidewalks, windows and balconies with candles and paper lanterns to begin the Christmas season. Here it is an ordinary December night.",
  },
  "colombia:independence-co": {
    skipText: "Your cousins send videos of the parade. You watch them in the afternoon and feel close to it all.",
  },

  // Dominican Republic
  "dominican-republic:nochebuena-do": {
    body: "At home, Christmas Eve means roast pork, moro de guandules, merengue from every house on the street and family staying up past midnight. Here the streets are quiet and cold.",
    host: "Cook Nochebuena dinner for whoever is still in town.",
  },
  "dominican-republic:independence-do": {
    body: "At home, February is carnival season, and the 27th closes it with parades, masks and flags in red, white and blue. Here it is a cold, ordinary weekday.",
    join: "Go to the Dominican community's Independence celebration.",
    skip: "Send greetings to the family chat and get on with your day.",
  },
  "dominican-republic:dia-madres-do": {
    body: "At home, Mother's Day falls on the last Sunday of May, weeks after the American one, and the whole family gathers around mothers and grandmothers. Here the days are getting long and warm.",
    join: "Join friends from the community for a Mother's Day brunch call.",
  },

  // Ecuador
  "ecuador:difuntos-ec": {
    body: "On 2 November, families at home visit the cemetery and share colada morada and guaguas de pan in memory of the people they miss. Here it is an ordinary busy week.",
  },
  "ecuador:ano-viejo-ec": {
    body: "At home 31 December means a paper and sawdust figure of the old year on every corner, ready to burn at midnight, and twelve grapes for twelve wishes. Here the streets are quiet and cold.",
    host: "Host a New Year's Eve dinner for friends who could not travel.",
  },
  "ecuador:carnaval-ec": {
    body: "At home Carnaval means two days off, water and foam in the streets, music and plates of fritada. Here it falls on an ordinary week this year.",
    join: "Go to the Ecuadorian community's Carnaval party.",
    skip: "Look through the family photos and have a quiet evening.",
  },

  // Egypt
  "egypt:coptic-christmas-eg": {
    body: "At home Coptic Christmas comes on 7 January, after a long fast for those who keep it, with a late church service on the eve and a family feast. It is a public holiday in Egypt. Here the holidays are over and January is just getting going.",
  },
  "egypt:sham-el-nessim-eg": {
    join: "Join the Egyptian community's picnic in the park.",
    skip: "Call home and get on with your day.",
  },

  // El Salvador
  "el-salvador:independence-sv": {
    body: "At home there are school parades, marching bands and blue and white flags on every corner. Here it is an ordinary week.",
    join: "Go to the Central American community's Independence party.",
    joinText: "Blue and white banners, cumbia from a speaker and a table of pupusas that empties fast. People from five countries cheer for each other's flags.",
    skip: "Watch the parade clips your family sends and get on with your day.",
  },
  "el-salvador:nochebuena-sv": {
    body: "At home, Christmas Eve means a late family dinner, panes con pavo, new clothes and fireworks in the street at midnight. The city is emptying out for the holidays.",
    host: "Make panes con pavo for whoever is still in town.",
  },

  // Ethiopia
  "ethiopia:enkutatash-et": {
    body: "At home the new year arrives in September, when the rains end and yellow adey abeba flowers cover the hills. Here it is an ordinary September week and nobody else knows the year has changed.",
    skip: "Call home, then get on with your day.",
  },

  // Fiji
  "fiji:fiji-day-fj": {
    body: "At home there are parades, sky blue flags and a public holiday, with families eating together afterward. Here it falls in an ordinary busy week.",
    skip: "Send greetings to the family group chat and get on with your day.",
    skipText: "Photos of the parade and the lunch table arrive all afternoon. You save every one, then make dinner.",
  },
  "fiji:diwali-fj": {
    body: "At home Diwali is a public holiday this year as always, and neighbours of every background share sweets, light diyas and watch the fireworks. Here it is an ordinary weeknight.",
    join: "Join the Diwali evening at the temple or the community celebration.",
  },
  "fiji:christmas-fj": {
    body: "At home Christmas means church in the morning, a lovo in the ground, relatives arriving from every island and a house full of singing. Here the streets are quiet and cold.",
    host: "Host a dinner for friends who could not travel.",
  },

  // Germany
  "germany:unity-day-de": {
    skipText: "Your father replies with a photo from their walk in the woods. You save it and go back to your day.",
  },
  "germany:advent-de": {
    body: "At home December means an Advent wreath with four candles, Christmas markets, homemade cookies and the big evening on the 24th. Here the streets are quiet and cold.",
  },

  // Ghana
  "ghana:independence-gh": {
    body: "At home there are parades at Black Star Square, school marches and a public holiday. Here it is an ordinary weekday with a long week ahead.",
    join: "Go to the Ghanaian community association's Independence Day dinner.",
    skip: "Send greetings to the family group chat and get some rest.",
    skipText: "Your phone fills with flags and photos of cousins in school uniform. You smile at each one, then go back to your evening.",
  },
  "ghana:christmas-newyear-gh": {
    body: "At home December means relatives returning from every region, new clothes for church and a watch night service on the 31st. Here the streets are quiet and cold.",
    join: "Spend Christmas with a Ghanaian family from church or the community.",
    host: "Host a New Year's Eve dinner for friends who could not travel.",
  },
  "ghana:easter-gh": {
    skip: "Call home on Sunday, then catch up on some rest.",
  },

  // Guatemala
  "guatemala:independence-gt": {
    body: "At home, schoolchildren run with torches on the 14th and march in parades on the 15th, with blue and white flags on every street. Here it is an ordinary week.",
    join: "Go to the Central American community's Independence party.",
    joinText: "Blue and white banners, marimba from a speaker and paper plates of tostadas and rellenitos. People from five countries cheer for each other's flags.",
    skip: "Watch the parade clips your family sends and get on with your day.",
  },
  "guatemala:todos-santos-gt": {
    body: "On 1 November your family visits the cemetery with flowers, shares fiambre and looks up at the giant kites flying over Sumpango and Santiago Sacatepéquez. Here it is an ordinary week.",
    joinText: "Tissue paper, glue and bamboo cover a church hall floor. The kite is far smaller than the ones at home, and it flies anyway.",
  },
  "guatemala:semana-santa-gt": {
    body: "Holy Week falls on an ordinary spring week here this year. At home, neighbours are laying carpets of dyed sawdust and flowers along the streets before the processions pass.",
    skip: "Watch the processions online in the evening.",
  },

  // India
  "india:diwali": {
    body: "Diwali falls on a weekday. At home there would be lamps, sweets and family. Here it is just another Tuesday, with an early start in the morning.",
    join: "Go to the Indian community association's Diwali night.",
    skip: "Call home and get some rest.",
    skipText: "Your family holds the phone up to the lamps. You smile, and then you rest.",
  },
  "india:holi": {
    title: "Holi in the park",
    body: "The local Indian community organizes a Holi event in the park. Colors fly, music plays, and people who have never seen it before are laughing and joining in.",
    skip: "Watch for a while, then head home.",
  },

  // Italy
  "italy:natale-it": {
    body: "At home there is the big dinner on the 24th, lunch on the 25th, panettone on the table and a round of tombola with the cousins. Here the streets are quiet and cold.",
    join: "Spend Christmas with an Italian family you met through the community.",
  },
  "italy:pasqua-it": {
    join: "Join the Italian community's Pasquetta picnic in the park.",
  },

  // Kenya
  "kenya:christmas-ke": {
    body: "At home December means packed buses out of the city, the whole family gathering upcountry, church in the morning and chapati and nyama choma all afternoon. Here the streets are quiet and cold.",
    join: "Spend Christmas with a Kenyan family from church or the community.",
    host: "Cook chapati and pilau for friends who could not travel.",
  },
  "kenya:madaraka-ke": {
    body: "At home it is a public holiday marking self-rule in 1963, with flags, speeches and a day off with family. Here it is an ordinary early summer day.",
    skip: "Send greetings to the family group chat and get on with your day.",
    skipText: "Your phone fills with flags and photos from home. You answer every message over the afternoon.",
  },

  // Mexico
  "mexico:independence-mx": {
    body: "On the night of 15 September, people at home gather to shout \"¡Viva México!\" for Independence Day on the 16th. Here it is a regular weeknight.",
    join: "Go to the Mexican community's Grito party.",
    skip: "Watch the Grito on your phone at home.",
    skipText: "The bells ring from the screen while you wash the dishes. You whisper along anyway.",
  },
  "mexico:dia-de-muertos": {
    body: "At home your family is setting up the ofrenda with marigolds, candles and photos of the people you miss. Here, the first week of November is an ordinary week.",
    join: "Help with the community ofrenda at the community center.",
  },
  "mexico:nochebuena": {
    body: "At home, Christmas Eve means a late dinner, tamales, family everywhere and someone falling asleep before midnight. The city is emptying out for the holidays.",
    host: "Make tamales with whoever is still in town.",
  },

  // New Zealand
  "new-zealand:waitangi-day-nz": {
    body: "At home it is a public holiday that marks the signing of Te Tiriti o Waitangi, with ceremonies, kapa haka, food and a lot of conversation about what the day means. Here it is a regular weekday.",
  },

  // Nigeria
  "nigeria:independence-ng": {
    body: "At home there are parades, green and white flags and a public holiday. Here it falls on a weekday with a busy day ahead.",
    join: "Go to the Nigerian community association's Independence party.",
    skip: "Send greetings to the family group chat and get on with your day.",
    skipText: "Your phone fills with flag emojis and photos from home. You smile at every one, then get on with your evening.",
  },
  "nigeria:christmas-newyear-ng": {
    body: "At home December means relatives arriving from every city, church services, big pots of rice and a crowded house. Here the streets are quiet and cold.",
    join: "Spend Christmas with a Nigerian family from church or the community.",
    host: "Host a New Year's Eve dinner for friends who could not travel.",
  },

  // Peru
  "peru:milagros-pe": {
    body: "October at home is the month of the Señor de los Milagros, with purple habits, long processions through Lima and turrón de Doña Pepa in every bakery. Here it is an ordinary busy month.",
  },
  "peru:navidad-pe": {
    body: "At home Christmas Eve means waiting until midnight, panetón with hot chocolate, a nativity scene and the whole family in one room. Here the city is emptying out for the holidays.",
    host: "Host a midnight hot chocolate for whoever is still in town.",
  },
  "peru:fiestas-patrias-pe": {
    skipText: "Your phone fills with red and white. You smile at every message on your afternoon walk.",
  },

  // Philippines
  "philippines:pasko-ph": {
    body: "At home Christmas begins long before December, with star lanterns in every window, dawn Masses and the whole family at the table for Noche Buena. Here the streets are quiet and cold.",
    join: "Spend Christmas Eve with a Filipino family from church or the community.",
    host: "Host a Noche Buena for friends who could not travel.",
  },
  "philippines:holy-week-ph": {
    body: "Holy Week falls on an ordinary spring week here this year. At home the country slows down, offices close and many families go back to their home province.",
  },

  // Poland
  "poland:wigilia-pl": {
    body: "At home the family waits for the first star, shares the opłatek wafer and sits down to twelve dishes, with an extra place set for an unexpected guest. Here the streets are quiet and cold.",
    join: "Spend Wigilia with a Polish family from the parish or the community.",
  },

  // Samoa
  "samoa:white-sunday-ws": {
    body: "At home on the second Sunday of October, children dress in white, lead the church service with songs and recitations, and are served first at the feast afterward. Here it is an ordinary October weekend.",
    hostText: "You explain that today the youngest person eats first. Your friends take the rule seriously and serve the youngest person in the room before anyone else.",
  },
  "samoa:christmas-ws": {
    body: "At home Christmas means church, the choir, family flying in from New Zealand and Australia, and a long to'ona'i with everyone at the table. Here the streets are quiet and cold.",
    host: "Host a dinner for friends who could not travel.",
  },
  "samoa:independence-ws": {
    body: "At home the first days of June mean flag raising in Apia, marching, siva and fautasi longboat races in the harbour. Here it is the start of summer, and the day would pass unnoticed.",
  },

  // South Korea
  "south-korea:chuseok-kr": {
    body: "Chuseok falls on a weekday this year. At home the roads would be full of families travelling to their hometowns, and the table would be covered with songpyeon and jeon. Here you have a long week ahead.",
    join: "Go to the Korean community association's Chuseok dinner.",
    skip: "Call your grandparents and get some rest.",
    skipText: "Your grandmother asks if you have eaten songpyeon, and you promise to find some. You hang up and go back to your evening with a full heart.",
  },
  "south-korea:seollal-kr": {
    body: "Lunar New Year falls on an ordinary week this year. At home you would bow to your elders, receive their good wishes and eat a bowl of tteokguk to mark the new year.",
    skip: "Bow to your family over video and get on with your day.",
  },
  "south-korea:parents-day-kr": {
    body: "At home, 8 May is the day children pin carnations on their parents and thank them. Here it is an ordinary busy week.",
    join: "Write letters home with other Koreans at the community center.",
    skip: "Send a message and get on with your day.",
    skipText: "Your father replies with a thumbs up and your mother with a long voice note. You listen to it twice before you go to sleep.",
  },

  // Tonga
  "tonga:christmas-newyear-to": {
    body: "At home Christmas and New Year run together: church, family arriving from overseas, feasting, and then Uike Lotu, the week of prayer that opens the year. Here the streets are quiet and cold.",
    host: "Cook for friends who could not travel.",
  },
  "tonga:fakame-to": {
    body: "At home on the first Sunday of May, children dress in white, stand up in church to recite and sing, and are served first at the meal afterward. Here it is an ordinary spring Sunday.",
  },
  "tonga:heilala-to": {
    skipText: "Your cousin sends video of the floats going past the palace. You watch it twice that evening.",
  },

  // Ukraine
  "ukraine:rizdvo-ua": {
    body: "At home Christmas Eve means Sviat Vechir, twelve meatless dishes beginning with kutia, and carols sung from door to door. Here the streets are quiet and cold.",
  },
  "ukraine:velykden-ua": {
    hostText: "The paska rises taller than the tin and you are prouder of it than of anything you have made in months. Your friends each take home a painted egg.",
  },

  // United Kingdom
  "united-kingdom:bonfire-night-gb": {
    body: "At home there are fireworks over the park, a bonfire, sparklers and something hot to eat in the cold. Here it is an ordinary weeknight.",
    join: "Find other British people in town and light sparklers together.",
    skip: "Watch your family's fireworks video and get on with your evening.",
    skipText: "Your sister sends a shaky video of the display over the park. You watch it twice, then make a cup of tea.",
  },
  "united-kingdom:christmas-gb": {
    body: "At home December means a tree in the front room, crackers on the table, a big roast and a long walk on Boxing Day. Here the streets are quiet and cold.",
  },
  "united-kingdom:pancake-day-gb": {
    join: "Go to a pancake night with other British people in town.",
  },

  // Venezuela
  "venezuela:navidad-ve": {
    body: "At home December means the whole family around one table making hallacas, gaitas on the radio and pan de jamón from the bakery. Here it is an ordinary December week.",
  },
  "venezuela:carnaval-ve": {
    body: "At home Carnaval means two days off, costumes, music in the plazas and children armed with water balloons. Here it falls on an ordinary week this year.",
    join: "Go to the Venezuelan community's Carnaval party.",
    skip: "Look through the family photos and have a quiet evening.",
  },

  // Vietnam
  "vietnam:trung-thu-vn": {
    join: "Go to the Vietnamese community association's Mid-Autumn night.",
    host: "Buy mooncakes and share them with your neighbours.",
  },
  "vietnam:teachers-day-vn": {
    body: "At home, 20 November is the day people bring flowers to their teachers and visit the ones who taught them years ago. Here it is an ordinary day.",
    join: "Join other Vietnamese families in town to thank the community's language teacher.",
    joinText: "You bring a small bouquet and a card for the woman who teaches Vietnamese to the children on weekends. She is surprised and delighted, and asks you to tell her about your own teachers.",
    hostText: "You send a long message to the teacher who first told you the world was bigger than your town. She answers within the hour, proud of you.",
    skip: "Send a greeting to your old friends from home and get on with your day.",
    skipText: "Old friends post photos of your school gate at home covered in flowers. You smile at every one.",
  },
  "vietnam:tet-vn": {
    body: "Tet, the Lunar New Year, falls on an ordinary week this year. At home the house would be cleaned, the family altar set, and everyone would come back for the first days of the year.",
    skip: "Call home on the first morning of the year and get on with your day.",
    skipText: "Everyone is in new clothes and the phone goes from hand to hand. Your grandmother wishes you good health and good luck, and you carry it with you all day.",
  },
};
