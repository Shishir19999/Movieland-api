// Curated sample catalogue (no network, no API key needed).
// Row: [title, year, genres, imdb rating, runtime (min), director, cast, plot]
const ROWS = [
  ['The Shawshank Redemption', 1994, 'Drama', 9.3, 142, 'Frank Darabont', 'Tim Robbins, Morgan Freeman, Bob Gunton', "A quiet banker sentenced to life in prison befriends a fellow inmate and spends decades quietly planning his way back to freedom."],
  ['The Godfather', 1972, 'Crime, Drama', 9.2, 175, 'Francis Ford Coppola', 'Marlon Brando, Al Pacino, James Caan', "The ageing head of a New York crime dynasty hands control to his reluctant youngest son, who is pulled deep into the family business."],
  ['The Dark Knight', 2008, 'Action, Crime, Drama', 9.0, 152, 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart', "Gotham's masked vigilante faces an anarchic criminal mastermind who pushes the city and its heroes to breaking point."],
  ['The Godfather Part II', 1974, 'Crime, Drama', 9.0, 202, 'Francis Ford Coppola', 'Al Pacino, Robert De Niro, Robert Duvall', "A new don tightens his grip on the family empire while flashbacks trace his father's rise from immigrant orphan to respected boss."],
  ['12 Angry Men', 1957, 'Crime, Drama', 9.0, 96, 'Sidney Lumet', 'Henry Fonda, Lee J. Cobb, Martin Balsam', "In a sweltering jury room, one holdout juror challenges eleven others to look again at the evidence in a murder trial."],
  ["Schindler's List", 1993, 'Biography, Drama, History', 9.0, 195, 'Steven Spielberg', 'Liam Neeson, Ben Kingsley, Ralph Fiennes', "A businessman in occupied Poland slowly turns his factory into a refuge that saves more than a thousand lives."],
  ['Pulp Fiction', 1994, 'Crime, Drama', 8.9, 154, 'Quentin Tarantino', 'John Travolta, Uma Thurman, Samuel L. Jackson', "Hit men, a boxer and a gangster's wife cross paths in a set of interlocking, darkly funny Los Angeles stories."],
  ['The Lord of the Rings: The Return of the King', 2003, 'Adventure, Fantasy', 9.0, 201, 'Peter Jackson', 'Elijah Wood, Viggo Mortensen, Ian McKellen', "As armies gather at the gates of Gondor, two hobbits struggle toward Mount Doom to end the power of the One Ring."],
  ['Forrest Gump', 1994, 'Drama, Romance', 8.8, 142, 'Robert Zemeckis', 'Tom Hanks, Robin Wright, Gary Sinise', "A kind-hearted man with a low IQ drifts through decades of American history, always carrying a torch for his childhood friend."],
  ['Fight Club', 1999, 'Drama', 8.8, 139, 'David Fincher', 'Brad Pitt, Edward Norton, Helena Bonham Carter', "An insomniac office worker and a charismatic soap salesman start an underground club that spirals far beyond its original purpose."],
  ['Inception', 2010, 'Action, Sci-Fi, Thriller', 8.8, 148, 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page', "A thief who steals secrets from dreams is offered one last job: planting an idea inside a target's mind."],
  ['The Matrix', 1999, 'Action, Sci-Fi', 8.7, 136, 'Lana Wachowski, Lilly Wachowski', 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss', "A hacker discovers his everyday world is a simulation and joins a rebellion against the machines that built it."],
  ['Goodfellas', 1990, 'Biography, Crime, Drama', 8.7, 145, 'Martin Scorsese', 'Ray Liotta, Robert De Niro, Joe Pesci', "A young man rises through the ranks of a New York mob family, enjoying the perks until the violence and paranoia close in."],
  ['Interstellar', 2014, 'Adventure, Drama, Sci-Fi', 8.7, 169, 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', "With Earth failing, a former pilot leads a crew through a wormhole in search of a new home for humanity."],
  ['Se7en', 1995, 'Crime, Mystery, Thriller', 8.6, 127, 'David Fincher', 'Brad Pitt, Morgan Freeman, Kevin Spacey', "Two detectives, one near retirement and one new to the city, hunt a killer whose crimes follow the seven deadly sins."],
  ['The Silence of the Lambs', 1991, 'Crime, Horror, Thriller', 8.6, 118, 'Jonathan Demme', 'Jodie Foster, Anthony Hopkins, Scott Glenn', "An FBI trainee seeks help from an imprisoned, brilliant psychiatrist to catch a serial killer before his next victim dies."],
  ['Spirited Away', 2001, 'Animation, Family, Fantasy', 8.6, 125, 'Hayao Miyazaki', 'Rumi Hiiragi, Miyu Irino, Mari Natsuki', "A girl wanders into a world of spirits and must work in a bathhouse to free her parents and find her way home."],
  ['Parasite', 2019, 'Comedy, Drama, Thriller', 8.5, 132, 'Bong Joon Ho', 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong', "A struggling family schemes its way into the lives of a wealthy household, with consequences nobody saw coming."],
  ['Gladiator', 2000, 'Action, Adventure, Drama', 8.5, 155, 'Ridley Scott', 'Russell Crowe, Joaquin Phoenix, Connie Nielsen', "A betrayed Roman general is enslaved and fights his way through the arena toward revenge on the emperor who wronged him."],
  ['The Lion King', 1994, 'Animation, Adventure, Family', 8.5, 88, 'Roger Allers, Rob Minkoff', 'Matthew Broderick, Jeremy Irons, James Earl Jones', "A young lion prince flees his kingdom after his father's death, then must return to reclaim his place."],
  ['Back to the Future', 1985, 'Adventure, Comedy, Sci-Fi', 8.5, 116, 'Robert Zemeckis', 'Michael J. Fox, Christopher Lloyd, Lea Thompson', "A teenager is flung thirty years into the past in a time-travelling car and must make sure his parents fall in love."],
  ['Whiplash', 2014, 'Drama, Music', 8.5, 106, 'Damien Chazelle', 'Miles Teller, J.K. Simmons, Paul Reiser', "An ambitious jazz drummer is pushed to his limits by a ferocious conservatory instructor."],
  ['The Prestige', 2006, 'Drama, Mystery, Sci-Fi', 8.5, 130, 'Christopher Nolan', 'Hugh Jackman, Christian Bale, Scarlett Johansson', "Two rival stage magicians in Victorian London obsess over outdoing each other, whatever the cost."],
  ['Saving Private Ryan', 1998, 'Drama, War', 8.6, 169, 'Steven Spielberg', 'Tom Hanks, Matt Damon, Tom Sizemore', "After the Normandy landings, a squad of soldiers is sent behind enemy lines to bring one paratrooper home."],
  ['Alien', 1979, 'Horror, Sci-Fi', 8.5, 117, 'Ridley Scott', 'Sigourney Weaver, Tom Skerritt, John Hurt', "The crew of a deep-space tug answers a distress call and brings something deadly back aboard."],
  ['Terminator 2: Judgment Day', 1991, 'Action, Sci-Fi', 8.6, 137, 'James Cameron', 'Arnold Schwarzenegger, Linda Hamilton, Edward Furlong', "A reprogrammed machine is sent back to protect a boy from a far more advanced killer robot."],
  ['Django Unchained', 2012, 'Drama, Western', 8.5, 165, 'Quentin Tarantino', 'Jamie Foxx, Christoph Waltz, Leonardo DiCaprio', "A freed man teams up with a bounty hunter to rescue his wife from a brutal plantation owner."],
  ['WALL-E', 2008, 'Animation, Adventure, Family', 8.4, 98, 'Andrew Stanton', 'Ben Burtt, Elissa Knight, Sigourney Weaver', "A lonely trash-compacting robot on an abandoned Earth follows a sleek probe into space and into a bigger adventure."],
  ['Coco', 2017, 'Animation, Adventure, Family', 8.4, 105, 'Lee Unkrich', 'Anthony Gonzalez, Gael Garcia Bernal, Benjamin Bratt', "A boy who dreams of music crosses into the Land of the Dead to uncover the story behind his family's ban on songs."],
  ['Joker', 2019, 'Crime, Drama, Thriller', 8.4, 122, 'Todd Phillips', 'Joaquin Phoenix, Robert De Niro, Zazie Beetz', "A struggling comedian in a decaying city is gradually pushed toward violence and a new, chaotic identity."],
  ['Avengers: Endgame', 2019, 'Action, Adventure, Sci-Fi', 8.4, 181, 'Anthony Russo, Joe Russo', 'Robert Downey Jr., Chris Evans, Mark Ruffalo', "The surviving heroes regroup for a final, time-bending attempt to undo the damage left by a cosmic tyrant."],
  ['Mad Max: Fury Road', 2015, 'Action, Adventure, Sci-Fi', 8.1, 120, 'George Miller', 'Tom Hardy, Charlize Theron, Nicholas Hoult', "In a desert wasteland, a drifter and a rebel commander race a war rig across the sand to escape a tyrant."],
  ['La La Land', 2016, 'Comedy, Drama, Musical, Romance', 8.0, 128, 'Damien Chazelle', 'Ryan Gosling, Emma Stone, John Legend', "A jazz pianist and an aspiring actress fall in love in Los Angeles while chasing dreams that pull them apart."],
  ['Titanic', 1997, 'Drama, Romance', 7.9, 194, 'James Cameron', 'Leonardo DiCaprio, Kate Winslet, Billy Zane', "Two passengers from opposite classes fall in love aboard the ill-fated ocean liner on its maiden voyage."],
  ['Jurassic Park', 1993, 'Adventure, Sci-Fi', 8.2, 127, 'Steven Spielberg', 'Sam Neill, Laura Dern, Jeff Goldblum', "A theme park of cloned dinosaurs goes wrong when the security systems fail and the visitors become prey."],
  ['The Shining', 1980, 'Drama, Horror', 8.4, 146, 'Stanley Kubrick', 'Jack Nicholson, Shelley Duvall, Danny Lloyd', "A writer takes a winter caretaker job at an isolated hotel, and the building slowly unravels his sanity."],
  ['Psycho', 1960, 'Horror, Mystery, Thriller', 8.5, 109, 'Alfred Hitchcock', 'Anthony Perkins, Janet Leigh, Vera Miles', "A secretary on the run stops at a remote motel run by a shy young man and his domineering mother."],
  ['Casablanca', 1942, 'Drama, Romance, War', 8.5, 102, 'Michael Curtiz', 'Humphrey Bogart, Ingrid Bergman, Paul Henreid', "A cynical nightclub owner in wartime Morocco must choose between love and helping a resistance leader escape."],
  ['Toy Story', 1995, 'Animation, Adventure, Comedy', 8.3, 81, 'John Lasseter', 'Tom Hanks, Tim Allen, Don Rickles', "A cowboy doll's place as his owner's favourite is threatened by a flashy new space ranger toy."],
  ['Finding Nemo', 2003, 'Animation, Adventure, Family', 8.2, 100, 'Andrew Stanton', 'Albert Brooks, Ellen DeGeneres, Alexander Gould', "An anxious clownfish crosses the ocean with a forgetful friend to find his missing son."],
  ['Spider-Man: Into the Spider-Verse', 2018, 'Animation, Action, Adventure', 8.4, 117, 'Bob Persichetti, Peter Ramsey, Rodney Rothman', 'Shameik Moore, Jake Johnson, Hailee Steinfeld', "A Brooklyn teenager gains spider powers and meets other web-slingers from parallel dimensions."],
  ['Blade Runner 2049', 2017, 'Drama, Mystery, Sci-Fi', 8.0, 164, 'Denis Villeneuve', 'Ryan Gosling, Harrison Ford, Ana de Armas', "A young replicant hunter uncovers a long-buried secret and goes looking for a missing former blade runner."],
  ['Dune', 2021, 'Action, Adventure, Sci-Fi', 8.0, 155, 'Denis Villeneuve', 'Timothee Chalamet, Rebecca Ferguson, Oscar Isaac', "A noble family takes charge of a desert planet that holds the galaxy's most precious resource, and betrayal follows."],
  ['Oppenheimer', 2023, 'Biography, Drama, History', 8.3, 180, 'Christopher Nolan', 'Cillian Murphy, Emily Blunt, Robert Downey Jr.', "The story of the physicist who led the wartime project to build the atomic bomb, and of the reckoning that followed."],
  ['The Grand Budapest Hotel', 2014, 'Adventure, Comedy, Crime', 8.1, 99, 'Wes Anderson', 'Ralph Fiennes, F. Murray Abraham, Tony Revolori', "A legendary concierge and his young lobby boy are caught up in the theft of a priceless painting and a family feud."],
  ['Amelie', 2001, 'Comedy, Romance', 8.3, 122, 'Jean-Pierre Jeunet', 'Audrey Tautou, Mathieu Kassovitz, Rufus', "A shy Paris waitress secretly improves the lives of those around her, then has to risk her own happiness."],
  ['Princess Mononoke', 1997, 'Animation, Adventure, Fantasy', 8.3, 134, 'Hayao Miyazaki', 'Yoji Matsuda, Yuriko Ishida, Yuko Tanaka', "A cursed prince is drawn into a war between an ironworks town and the spirits of the forest."],
  ['Seven Samurai', 1954, 'Action, Drama', 8.6, 207, 'Akira Kurosawa', 'Toshiro Mifune, Takashi Shimura, Keiko Tsushima', "A poor village hires seven masterless warriors to defend its harvest against a band of raiders."],
  ['City of God', 2002, 'Crime, Drama', 8.6, 130, 'Fernando Meirelles, Katia Lund', 'Alexandre Rodrigues, Leandro Firmino, Matheus Nachtergaele', "Two boys grow up in a Rio de Janeiro slum, one becoming a photographer and the other a feared gang leader."],
  ['Leon: The Professional', 1994, 'Action, Crime, Drama', 8.5, 110, 'Luc Besson', 'Jean Reno, Gary Oldman, Natalie Portman', "A solitary hit man reluctantly takes in a twelve-year-old neighbour after her family is killed by corrupt agents."],
  ['Get Out', 2017, 'Horror, Mystery, Thriller', 7.7, 104, 'Jordan Peele', 'Daniel Kaluuya, Allison Williams, Bradley Whitford', "A young photographer visits his girlfriend's family estate and slowly realises something is deeply wrong."],
  ['Knives Out', 2019, 'Comedy, Crime, Mystery', 7.9, 130, 'Rian Johnson', 'Daniel Craig, Chris Evans, Ana de Armas', "A detective investigates the death of a wealthy novelist while his scheming family circles the inheritance."],
  ['The Social Network', 2010, 'Biography, Drama', 7.8, 120, 'David Fincher', 'Jesse Eisenberg, Andrew Garfield, Justin Timberlake', "A Harvard student builds a campus website that explodes into a global company and leaves lawsuits in its wake."],
  ['Top Gun: Maverick', 2022, 'Action, Drama', 8.2, 130, 'Joseph Kosinski', 'Tom Cruise, Miles Teller, Jennifer Connelly', "A veteran test pilot returns to train a squad of graduates for a mission that seems impossible."],
  ['Everything Everywhere All at Once', 2022, 'Action, Adventure, Comedy', 7.8, 139, 'Daniel Kwan, Daniel Scheinert', 'Michelle Yeoh, Stephanie Hsu, Ke Huy Quan', "An overwhelmed laundromat owner is pulled across the multiverse to stop a threat that could erase every reality."],
  ['The Truman Show', 1998, 'Comedy, Drama, Sci-Fi', 8.2, 103, 'Peter Weir', 'Jim Carrey, Ed Harris, Laura Linney', "An insurance salesman gradually discovers that his whole life is a television show watched around the world."],
  ['Groundhog Day', 1993, 'Comedy, Fantasy, Romance', 8.0, 101, 'Harold Ramis', 'Bill Murray, Andie MacDowell, Chris Elliott', "A cynical weatherman is trapped reliving the same small-town winter day until he learns to change."],
  ['Inside Out', 2015, 'Animation, Adventure, Comedy', 8.1, 95, 'Pete Docter', 'Amy Poehler, Phyllis Smith, Bill Hader', "The emotions inside a young girl's mind scramble to cope when her family moves to a new city."],
  ['Ratatouille', 2007, 'Animation, Comedy, Family', 8.1, 111, 'Brad Bird', 'Patton Oswalt, Lou Romano, Ian Holm', "A rat with a gift for cooking teams up with a clumsy kitchen worker in a famous Paris restaurant."],
  ['Rocky', 1976, 'Drama, Sport', 8.1, 119, 'John G. Avildsen', 'Sylvester Stallone, Talia Shire, Burt Young', "A small-time Philadelphia boxer gets a shot at the heavyweight title and a chance to prove himself."],
  ["Singin' in the Rain", 1952, 'Comedy, Musical, Romance', 8.3, 103, 'Gene Kelly, Stanley Donen', "Gene Kelly, Donald O'Connor, Debbie Reynolds", "Hollywood stars scramble to survive the arrival of talking pictures in this song-filled comedy."],
]

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const LANGUAGES = {
  'Spirited Away': 'Japanese',
  'Princess Mononoke': 'Japanese',
  'Seven Samurai': 'Japanese',
  Parasite: 'Korean',
  Amelie: 'French',
  'City of God': 'Portuguese',
}

export const CATALOG = ROWS.map(
  ([title, year, genres, rating, runtime, director, cast, plot]) => ({
    id: `s-${slug(title)}`,
    source: 'sample',
    type: 'movie',
    title,
    year,
    poster: null,
    genres: genres.split(', '),
    rating,
    runtime,
    director,
    cast: cast.split(', '),
    plot,
    ratings: [{ source: 'IMDb', value: `${rating.toFixed(1)}/10` }],
    language: LANGUAGES[title] || 'English',
    detailed: true,
  }),
)

export const GENRES = [...new Set(CATALOG.flatMap((m) => m.genres))].sort()
export const DECADES = [...new Set(CATALOG.map((m) => Math.floor(m.year / 10) * 10))].sort(
  (a, b) => b - a,
)
export const LANGUAGE_LIST = [...new Set(CATALOG.map((m) => m.language))].sort()
export const CATALOG_BY_ID = new Map(CATALOG.map((m) => [m.id, m]))
// ids used by earlier versions of the app keep working
export const findCatalogMovie = (id) => CATALOG_BY_ID.get(String(id).replace(/^demo-/, 's-'))
