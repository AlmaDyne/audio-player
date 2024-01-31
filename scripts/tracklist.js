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
        artist: 'Sample',
        title: 'FX1',
        src: 'music/6.mp3'
    },
    track7: {
        artist: 'Sample',
        title: 'FX2',
        src: 'music/7.mp3'
    },
    track8: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Cold Lights (Metal Mix)',
        src: 'music/1.mp3'
    },
    track9: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Silent Minds',
        src: 'music/2.mp3'
    },
    track10: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Classical TechnoDub',
        src: 'music/3.mp3'
    },
    track11: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'First Snow',
        src: 'music/4.mp3'
    },
    track12: {
        artist: 'Zmicier M. (feat. ATD) Extra-MEGA Internet Band Collaboration',
        title: 'New Year 2020 Experiment (Super Apocalyptic Remix and Extremely Cool Job)',
        src: 'music/5.mp3'
    },
    track13: {
        artist: 'Sample',
        title: 'FX1',
        src: 'music/6.mp3'
    },
    track14: {
        artist: 'Sample',
        title: 'FX2',
        src: 'music/7.mp3'
    },
    track15: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Cold Lights (Metal Mix)',
        src: 'music/1.mp3'
    },
    track16: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Silent Minds',
        src: 'music/2.mp3'
    },
    track17: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'Classical TechnoDub',
        src: 'music/3.mp3'
    },
    track18: {
        artist: 'Zmicier M. (feat. ATD)',
        title: 'First Snow',
        src: 'music/4.mp3'
    },
    track19: {
        artist: 'Zmicier M. (feat. ATD) Extra-MEGA Internet Band Collaboration',
        title: 'New Year 2020 Experiment (Super Apocalyptic Remix and Extremely Cool Job)',
        src: 'music/5.mp3'
    },
    track20: {
        artist: 'Sample',
        title: 'FX1',
        src: 'music/6.mp3'
    },
    track21: {
        artist: 'Sample',
        title: 'FX2',
        src: 'music/7.mp3'
    }
};

/*for (let i = 1; i <= 1000; i++) {
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
