# The Taxonomies

In my early experiments with Kaleidoscope, when it was nothing more than a script to randomly select media, I noticed quite a lot of disparity in what it selected - so much so that made for a very dissonant viewing experience. This dissonance made me introspect into how TV channels in the 90s and early 2000s curated their timeslots into something more cohesive. Currently from that deeper analysis, Kaleidoscope is now designed to have a feature for traversal through thematically adjacent media for a better viewing experience. What I mean by this is that Kaleidoscope will attempt, through its procedural media selection, to schedule two pieces of media next to eachother that avoids being thematically dissociative - it wont schedule Dora the Explorer and then Friday the 13th next. When exploring this functionality I found that the widely accepted genre classifications dont really accomplish what is needed due to a few factors - mainly a misalignment between the over all media's plot, set and setting and the media's common genre classication for how those genres are defined.

There is the additional issue that some movies with widely accepted genres do not match thematically what is happening on screen with other media in the same genre. Science Fiction is the most egregious of the common genres, as movies like Arrival, Star Wars, Dune, Short Circuit, Pacific Rim, and Forbidden Planet are all considered to fall under the Science Fiction umbrella based on current defintions. However if you watched that selection of movies listed in order, the movies feel dissasociative with eachother even though they are all considered grouped under the same genre.

To solve this issue for Kaleidoscope I have approached media with two main paradigms in the design. The first paradigm is that no media is ever viewed the same by any person - there are aspects of any given piece of media that are more important than other aspects that are subjective to one's own idiom. The second paradigm is that words mean things, and we should have a strict adherence to their defintions, especially in software design.

Through these concepts I did an analysis on a large variety of movies and drilled down into them to really understand what makes them what they are, and to better understand the concept of genres as a whole. For instance when drilling into Star Wars, I asked questions such as: "Is this actually science fiction? If it does not match thematically with how science fiction is defined, then why do people consider it to be science fiction?" From that specific baseline I was able to consider other aspects of media and understand the different facets that set them apart or group them with other media. This allowed me to create the below 6 + 1 taxonomies for all visual media that Kaleidoscope would need to classify.

## 1 - Genres

Genres are the narrative backbone of media - they describe the fundamental story type or plot structure. These are broad categories that communicate the kind of story being told rather than the style or mood in which it is presented. Some examples include Science Fiction, Fantasy, Action, Horror, Drama, Comedy, Romance, Mystery, and Thriller.

In Kaleidoscope, genres are used to help identify the primary narrative DNA of a piece of media. A Western (such as The Magnificent Seven) and a Samurai film (Seven Samurai) can share the same narrative genre (e.g., Action-Drama) even though they differ wildly in aesthetic presentation. In essence, the plot is what the piece of media is trying to say, the main points its trying to make or convey, how the plot is presented is separated from the main narrative. It doesnt matter if you met the wizard in a galaxy far far away or in middle earth - if there is magic and the hero's journey, it is likely a Fantasy genre.

It is important to note that many films have multiple genres, and the combination of those genres change the tone of the media over all to be greater than the some of its parts. For instance Horror encapsulates the idea of dread, where the main narrative is being confronted with fear and the unknown and the other, such as in movies like Halloween, The Exorcist, or Hellraiser. Science Fiction however lays heavily in existential philosophy and speculative realistic technologies over spiritual or magical justifications, movies such as Arrival, Interstellar or Gattaca. However when you combine Science Fiction and Horror, you arrive on the horrors of technology and the hubris of man in it's usage, where they go wrong and how the ethics of them can cause harm and terror, movies such as The Fly, Alien, and Event Horizon - the philosophical discussion of our future is surrounding the terrors it causes. This pattern is common when you combine genres, the genres combined usually 'speak' about eachother in some way.

## 2 - Aesthetics

Aesthetics define the visual, cultural, and tonal identity of media - the 'surface flavor' of how a story is presented. Unlike genres, aesthetics are not about the core plot structure, but about how that plot is dressed, framed, and delivered to the audience.

Some Examples include Western, Wuxia, Space Opera, Mecha, Noir, Cyberpunk, Gothic, Fairy Tale, High Seas (Nautical), Post-Apocalyptic, and Mythic.

Aesthetics can cut across genres - Science Fiction media can be presented as a Space Opera (The Expanse), Dystopian (Interstellar), Mecha (Gundam), etc. By tracking aesthetics independently from narrative genre, Kaleidoscope can group thematically similar works even when their genres differ.

Note also that it is possible for media to have more than one Aesthetic taxonomy, much like Genres, some examples being Pacific Rim (Dystopian Mecha) or Mortal Engines (Dystopian Diesel-Punk), and while these aesthetics can work in conjunction with eachother the however do not 'comment' on eachother the way that Genre taxonomies do.

## 3 - Age Groups

Age Groups define the intended audience maturity level for a piece of media. This allows Kaleidoscope to avoid jarring transitions between media for very different audiences, especially when scheduling content in sequence. There is also a consideration that the Age Group of a piece of media gives vastly tonal differences in a piece of media. What is considered inside the Horror Genre in the Kids Age Group, movies such as Ferngully, The Rescuers or An American Tale, are not considered horror to an adult.

Kaleidoscope comes with 4 Age Groups by default based on the standard MPAA ratings but they can be changed, increased or decreased based on the user's own idiom. The 4 default Age Groups are:

Kids - simple lessons, low tension, broad strokes 

Family – suitable for ages 6–12, mild peril, light humor

Young Adult – more complex themes, some violence, romantic subplots, maybe a curse word or two

Adult – mature themes and language, stronger violence, sexual situations

Age Groups ensure The Rescuers doesn’t play back-to-back with Annihilation - even if both could technically be classified under a broader genre pair like Adventure Horror set in the modern era.

## 4 - Eras

Eras define the time period in which media was produced. This gives Kaleidoscope the ability to group works by production style specifically surrounding where the media was produced. For users searching for a thematic continuity, viewers who want to experience a particular time period that is explicitly presented in the media such as things like "Ancient World" (Ben-Hur, Troy, 300), "Medieval" (A Knight's Tale, The Name of the Rose, Robin Hood), "Colonial America" (The Last of the Mohicans, The Patriot, Sleepy Hollow), etc - these specific types of 'era settings' are primarily meant for the Aesthetic taxonomy, the Eras taxonomy is something different.

The reason for this distinction and the particular taxonomy is entirely based on how story telling has evolved as a medium, and how plot is presented beyond just its aesthetics. These eras were defined by tropes that went beyond the plot, set, and setting of the stories that were being told. Here are a couple of quick examples of how Eras differentiate movies in production style:

**1980s: Bold, Mythic, and Straightforward**

Movies in the 1980s often told stories like modern myths. The structure was very clear and linear: you followed a main character from the beginning of a problem to a triumphant resolution. The emotional beats were big and obvious, almost cartoonishly clean. Heroes were clearly heroic, villains were clearly evil, and the idea was to give the audience a satisfying, feel-good resolution. Filmmakers weren’t afraid of being earnest or sentimental - sincerity wasn’t embarrassing yet. Even when the topics were dark (like dystopia or crime), the storytelling tone still felt heightened and fantastical.

Movies were built around a bold, simple “hook” and the story served that hook. The character development existed mainly to propel the adventure forward. You didn’t spend a lot of time sitting with internal doubt or moral ambiguity - the characters, even if flawed, would ultimately rise to a recognizable heroic ideal. Think of Back to the Future or Die Hard: they are exciting rides with charm and heart, and the audience is never emotionally lost. Every moment serves the adventure, and you leave with a sense of resolution and triumph. Dialogue is punchy, memorable, and sometimes a little exaggerated - it’s written to be quoted.

**1990s: Ironic, Personal, and Introspective**

Movies in the 1990s, storytelling began turning inward. Directors became more fascinated by flawed characters, moral gray zones, and the idea that the ending might not actually solve the problem. Stories were less about the plot as a straight line and more about exploring personality and perspective. It wasn’t enough to have a 'good guy vs bad guy' - now the protagonist might be deeply conflicted, or even unreliable, and the story could jump around in time or style to reflect that.

There was also a layer of self-awareness. Movies in the 90s often felt like they knew they were movies: characters talked like real people, referencing pop culture, arguing about TV shows, or rambling about their philosophies. The emotional tone was often ironic or detached, as if the movie itself was commenting on its own genre. You can see that in Pulp Fiction, where violence is mixed with casual conversations about fast food and foot massages, or in Fight Club, where the movie is less a plot-driven action story and more a psychological reflection on masculinity, consumerism, and identity. Endings weren’t always neat, and sometimes they were left ambiguous or unsettling on purpose.


## 5 - Specialties

Specialties are custom thematic groupings that may not be universally recognized but are still useful for grouping pieces of media based on the user's whims. They can be based on creators, franchises, recurring themes, or narrative structures, or anything the user deems important to relate media to eachother.

Some possibilites include:

**Franchise Specialties**: Marvel Cinematic Universe, Star Trek, The Matrix

**Creator Specialties**: Hayao Miyazaki Films, Quentin Tarantino Films, Disney

**User Based Specialties**: Childhood Favorites, Movies Scored by Trent Reznor, Summer Blockbusters

**Nostalgia Specialties**: Toonami, Saturday Morning Cartoons

Specialties are intentionally flexible - they exist for any grouping that viewers may wish to track outside the constraints of strict genre or aesthetic definitions.

## 6 - Holidays

Holiday classification allows Kaleidoscope to identify seasonally relevant media. These groupings can be based on overt holiday settings or strong thematic ties to particular celebrations.

Some Examples include:

Christmas (It’s a Wonderful Life, Home Alone, Die Hard)

Halloween (Hocus Pocus, Halloween, Trick ’r Treat)

Valentine’s Day (The Notebook, Crazy Rich Asians)

Holidays help Kaleidoscope automatically surface and schedule media during specific times of year for thematic alignment.

## +1 - Musical Genres

Musical Genres apply exclusively to music videos and are not part of the core six taxonomies because they serve a different purpose. They are comprised of the normal known musical genres of the songs associated with the music videos. These are however used in a very specific way.

Some Examples include: Rock, Synthwave, Fusion, Pop, Hip-Hop, Power Metal, Jazz, G-Funk, Country, Grunge, Electronic, and Classical.

For Musical Genres in Kaleidoscope I have created a specific feature in which I call Mosaic. The core concept of Kaleidoscope is that the continuity of the stream of media should not be jarring to the experience. Thus to incoporate music videos as media to buffer the time between shows and movies, I needed a way to associate music to the other 6 taxonomies in some way. To accomplish this, Mosaic is designed to pick music based on an approximation of emotional correlation between a piece of music and the overall look, feel, and subject of the media that it is buffering. More on Mosaics **here**