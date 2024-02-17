export const tracklist = {
    track1: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Cold Lights (Metal Mix)',
        src: 'music/1.mp3'
    },
    track2: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Silent Minds',
        src: 'music/2.mp3'
    },
    track3: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Classical TechnoDub',
        src: 'music/3.mp3'
    },
    track4: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'First Snow',
        src: 'music/4.mp3'
    },
    track5: {
        artist: 'Zmicier M. (feat. ATD) Extra-MEGA Internet Band Collaboration',
        title: 'New Year 2020 Experiment (Super Apocalyptic Remix and Extremely Cool Job)',
        src: 'music/5.mp3'
    },
    track6: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Harpsichords Attack!',
        src: 'music/6.mp3'
    },
    track7: {
        artist: 'Dmitry Miroshkin & Anthony Driverson',
        title: 'Raindrops (Guitar Mix)',
        src: 'music/7.mp3'
    },
    track8: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Thousand Miles (of Drinking)',
        src: 'music/8.mp3'
    }
};

/*for (let i = 22; i <= 1000; i++) {
    tracklist['track' + i] = {
        artist: 'Artist ',
        title: 'Title ',
        src: '#'
    };
}*/

for (let track in tracklist) {
    let artist = tracklist[track]['artist'];
    let title = tracklist[track]['title'];
    let k = 0;

    for (let comparedTrack in tracklist) {
        let comparedArtist = tracklist[comparedTrack]['artist'];
        let comparedTitle = tracklist[comparedTrack]['title'];

        if (comparedArtist === artist && comparedTitle === title) {
            k++;

            if (k > 1) {
                tracklist[comparedTrack]['dub'] = k;
            }
        }
    }
}
