import { tracklist } from '../scripts/tracklist.js';
import { configClassic } from '../scripts/controls-config-classic.js';
import { configStylish } from '../scripts/controls-config-stylish.js';
import { PlayerButtonsHoverIntent } from '../scripts/player-buttons-hover-intent.js';

const player = document.getElementById('player');
const tooltip = document.getElementById('tooltip');
const displayInfo = document.getElementById('display-info');
const trackTitleDisplay = document.getElementById('display-title');
const artistNameDisplay = document.getElementById('display-artist');
const curTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const timeRange = document.getElementById('time-range');
const timeline = document.getElementById('timeline');
const timeBar = document.getElementById('time-bar');
const playerControls = document.querySelector('player-controls');
const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');
const rewindBtn = document.getElementById('rewind');
const forwardBtn = document.getElementById('forward');
const indicator = document.getElementById('indicator');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const volumeBtn = document.getElementById('volume');
const volumeRange = document.getElementById('volume-range');
const volumeline = document.getElementById('volumeline');
const volumeBar = document.getElementById('volume-bar');
const playlistLim = document.getElementById('playlist-limiter');
const playlist = document.getElementById('playlist');
const titleHeight = parseInt(getComputedStyle(playlistLim).getPropertyValue('--track-title-height'));
const scrollArrowUp = document.getElementById('scroll-arrow-up');
const scrollArrowDown = document.getElementById('scroll-arrow-down');
const configBtn = document.getElementById('configuration');
const colorBtn = document.getElementById('coloring');
const playlistStyleBtn = document.getElementById('playlist-style');
const settingsBtn = document.getElementById('settings');
const infoBtn = document.getElementById('info');
const settingsArea = document.getElementById('settings-area');
const curPlaylist = document.getElementById('current-playlist');
const defaultSetBtn = document.getElementById('default-settings');
const closeSetBtn = document.getElementById('close-settings');
const modalArea = document.getElementById('modal-area');
const TIMELINE_MARGIN = Math.abs(parseInt(getComputedStyle(timeline).marginLeft));    
const TIMELINE_POSITION_CHANGE_STEP = 0.5;
const TIMELINE_UPDATE_INTERVAL = 200;
const LAG = 10;
const ACCELERATION_FACTOR = 5;
const ACCELERATION_DELAY = 750;
const PLAYLIST_FINISH_DELAY = 500;
const DEFAULT_VALUES_DATA = {
    'visible-tracks---classic-config': 7,
    'visible-tracks---stylish-config': 5,
    'player_volume': 0.75,
    'scroll-elements-opacity': 70,
    'wheel-scroll-step': 2
};
let defaultPlaylist = [];
let orderedPlaylist = [];
let orderedDownloads = [];
let fixedPlaylistStrings = new Map();
let highlightedBtns = new Set();
let activeScrollKeys = new Set();
let activeStepAccKeys = new Set();
let canceledStepAccKeys = new Set();
let keyRepeating = false;
let mouseModeScrolling = false;
let cursorOverPlaylist = false;
let playOn = false;
let roundTime = false;
let timePosSeeking = false;
let timeRangeEnter = false;
let timelinePos = 0;
let timerTimelineUpd = null;
let timerAccelerationDelay = null;
let timerFinishPlay = null;
let timerHideScrollElements = null;
let timerConfigBtn = null;
let timerSettingsArea = null;
let timerModalArea = null;
let titleMoveTimers = {};
let requestCheckCurTime = null;
let requestAnimateScrolling = null;
let requestScrollInMouseMode = null;
let requestScrollOnKeyRepeat = null;
let curAccelerateKey = null;
let acceleratePlaying = true;
let acceleration = false;
let accelerationType = 'none';
let timeRangeHoverIntent = {};
let volumeRangeHoverIntent = {};
let selectedAudio;

const accelerationData = {
    'fast-forward': {
        playbackRate: ACCELERATION_FACTOR,
        classIcons: {
            accOn: 'icon-fast-forward',
            accOff: 'icon-to-end'
        },
        button: forwardBtn
    },
    'fast-rewind': {
        playbackRate: -ACCELERATION_FACTOR,
        classIcons: {
            accOn: 'icon-fast-backward',
            accOff: 'icon-to-start'
        },
        button: rewindBtn
    },
    'none': {
        playbackRate: 1
    }
};

const stepKeysData = {
    KeyA: {
        'step-function': rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    KeyD: {
        'step-function': forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    },
    ArrowLeft: {
        'step-function': rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    ArrowRight: {
        'step-function': forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    },
    PointerRewind: {
        'step-function': rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    PointerForward: {
        'step-function': forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    }
};

const scrollingKeysData = {
    duration: 120,
    'ArrowUp': {
        direction: 'up',
        deltaHeight: function() { return titleHeight },
        factor: 1
    },
    'ArrowDown': {
        direction: 'down',
        deltaHeight: function() { return titleHeight },
        factor: 1
    },
    'PageUp': {
        direction: 'up',
        deltaHeight: function() { return titleHeight * 2 },
        factor: 2
    },
    'PageDown': {
        direction: 'down',
        deltaHeight: function() { return titleHeight * 2 },
        factor: 2
    },
    'Home': {
        direction: 'up',
        deltaHeight: function() { return playlistLim.scrollTop }
    },
    'End': {
        direction: 'down',
        deltaHeight: function() {
            return playlistLim.scrollHeight - (playlistLim.scrollTop + playlistLim.clientHeight)
        }
    }
};

///////////////////////
// Playlist creation //
///////////////////////

try {
    for (let track in tracklist) {
        let trackElem = document.createElement('div');
        trackElem.className = 'track';
        playlist.appendChild(trackElem);
    
        let audioElem = document.createElement('audio');
        audioElem.setAttribute('data-artist', tracklist[track]['artist']);
        audioElem.setAttribute('data-title', tracklist[track]['title']);
        let src = tracklist[track]['src'];
        src += '?nocache=' + Math.random(); // Тестовая очистка кэша
        audioElem.setAttribute('data-source', src);
        if (tracklist[track]['dub']) audioElem.setAttribute('data-dub', tracklist[track]['dub']);
        audioElem.setAttribute('type', 'audio/mpeg');
        audioElem.setAttribute('preload', 'auto');
        trackElem.appendChild(audioElem);

        let loadElem = document.createElement('div');
        loadElem.className = 'loading-figure';
        loadElem.hidden = true;
        trackElem.appendChild(loadElem);
    
        let limiterElem = document.createElement('div');
        limiterElem.className = 'screen-limiter';
        trackElem.appendChild(limiterElem);
    
        let authorTitleElem = document.createElement('span');
        authorTitleElem.className = 'author-title';
        authorTitleElem.textContent = tracklist[track]['artist'] + ' \u2013 ' + tracklist[track]['title'];
        if (tracklist[track]['dub']) authorTitleElem.textContent += ' (' + tracklist[track]['dub'] + ')';
        limiterElem.appendChild(authorTitleElem);

        defaultPlaylist.push(audioElem);
    }
} catch(error) {
    console.error(error.name + ': ' + error.message);
    console.log('Object "tracklist" in "tracklist.js" is not founded!');
}

setDefaultPlaylist(defaultPlaylist);

console.log(localStorage);
//localStorage.clear();

///////////////////////////////////
// Initial buttons configuration //
///////////////////////////////////

const configsBank = ['classic', 'stylish'];
let config = localStorage.getItem('buttons_configuration');

customElements.define('player-controls', class extends HTMLElement {
    connectedCallback() {
        this.attachShadow({mode: 'open'});
    }

    static get observedAttributes() {
        return ['config'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log('buttons ' + name + ' = ' + newValue);

        localStorage.setItem('buttons_configuration', newValue);

        if (newValue != oldValue) {
            clearTimeout(timerConfigBtn);
            configBtn.parentElement.classList.remove('rotate');
    
            setTimeout(() => {
                configBtn.parentElement.classList.add('rotate');
    
                let transTime = getComputedStyle(configBtn.parentElement).animationDuration;
                timerConfigBtn = setTimeout(() => {
                    configBtn.parentElement.classList.remove('rotate');
                }, parseFloat(transTime) * 1000);
            });
        }

        switch (newValue) {
            case 'classic':
                player.insertAdjacentHTML('beforeend', configClassic);
                break;
            case 'stylish':
                player.insertAdjacentHTML('beforeend', configStylish);
                break;
        }
        
        const tmplConfig = document.getElementById('tmpl-' + newValue);
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(tmplConfig.content.cloneNode(true));
        tmplConfig.remove();
    }
});

changeConfig( configsBank.indexOf(config) );

function changeConfig(idx) {
    config = configsBank[idx] || configsBank[0];
    playerControls.setAttribute('config', config);
    
    if (changeNumberOfVisibleTracks.initialRun) {
        changeNumberOfVisibleTracks(numOfVisTracks);
    }
}

/////////////////////////////
// Initial player coloring //
/////////////////////////////

const playerColorsBank = ['black', 'white'];
let playerColor = localStorage.getItem('player_color');

changePlayerColor( playerColorsBank.indexOf(playerColor) );

function changePlayerColor(idx) {
    player.classList.remove('color-' + playerColor);
    playerColor = playerColorsBank[idx] || playerColorsBank[0];
    localStorage.setItem('player_color', playerColor);
    player.classList.add('color-' + playerColor);

    console.log('player color = ' + playerColor);

    let transTime = getComputedStyle(document.querySelector(':root')).getPropertyValue('--transition-time-main');
    indicator.style.transitionDuration = transTime;
    setTimeout(() => indicator.style.transitionDuration = '', parseFloat(transTime));
}

////////////////////////////
// Initial playlist style //
////////////////////////////

const playlistStylesBank = ['smooth', 'strict'];
let playlistStyle = localStorage.getItem('playlist_style');

changePlaylistStyle( playlistStylesBank.indexOf(playlistStyle) );

function changePlaylistStyle(idx) {
    if (selectedAudio) removeSelected(selectedAudio);
    playlist.classList.remove(playlistStyle);
    playlistStyle = playlistStylesBank[idx] || playlistStylesBank[0];
    localStorage.setItem('playlist_style', playlistStyle);
    playlist.classList.add(playlistStyle);
    if (selectedAudio) setSelected(selectedAudio);

    console.log('playlist style = ' + playlistStyle);

    switch (playlistStyle) {
        case "smooth": // Font
            playlistStyleBtn.className = 'icon-align-center';
            break;
        case "strict": // Borders
            playlistStyleBtn.className = 'icon-align-left';
            break;
    }
}

////////////////////
// Initial volume //
////////////////////

let settedVolume = localStorage.getItem('player_volume');
let savedVolume;

changeVolume(settedVolume);

function changeVolume(value) {
    if (value == null) {
        value = DEFAULT_VALUES_DATA['player_volume'];
    }

    settedVolume = +value;
    savedVolume = settedVolume;

    localStorage.setItem('player_volume', settedVolume);
    
    showVolumeIcon(settedVolume);

    if (settedVolume) {
        volumeBar.classList.add('active');
    } else {
        volumeBar.classList.remove('active');
    }
    
    let volBarPos = (volumeRange.offsetWidth - volumeBar.offsetWidth) * settedVolume;
    volumeBar.style.left = volBarPos + 'px';
    volumeline.style.width = volBarPos + volumeBar.offsetWidth / 2 + 'px';
    
    if (volumeRangeHoverIntent.elemRect) volumeRangeHoverIntent.executeTask();
    if (selectedAudio) selectedAudio.volume = settedVolume;
}

//////////////////////////////////////
// Initial number of visible tracks //
//////////////////////////////////////

const visibleTracksInput = document.getElementById('visible-tracks');
const visibleTracksCheckbox = document.getElementById('visible-tracks-checkbox');
let checkedVisibleTracksBox = localStorage.getItem('checked-visible-tracks-box') || 'false';
let numOfVisTracks = localStorage.getItem('number_of_visible_tracks');

changeNumberOfVisibleTracks(numOfVisTracks);
changeNumberOfVisibleTracks.initialRun = true;

visibleTracksCheckbox.onchange = (event) => {
    let value;

    if (event.target.checked) {
        checkedVisibleTracksBox = 'true';
        value = +visibleTracksInput.value;
    } else {
        checkedVisibleTracksBox = 'false';
        value = null;
    }

    changeNumberOfVisibleTracks(value);
};

visibleTracksCheckbox.addEventListener('keydown', (event) => {
    if (event.key == 'Enter') {
        event.target.checked = !event.target.checked;
        event.target.dispatchEvent(new Event('change')); 
    }
});

visibleTracksInput.oninput = () => {
    let value = +visibleTracksInput.value;
    changeNumberOfVisibleTracks(value);
};

function changeNumberOfVisibleTracks(value) {
    if (value == null || checkedVisibleTracksBox === 'false') {
        visibleTracksCheckbox.checked = false;
        visibleTracksInput.disabled = true;
        checkedVisibleTracksBox = 'false';

        value = DEFAULT_VALUES_DATA[`visible-tracks---${config}-config`];
    } else {
        visibleTracksCheckbox.checked = true;
        visibleTracksInput.disabled = false;
    
        let minValue = +visibleTracksInput.min;
        let maxValue = +visibleTracksInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    numOfVisTracks = value;
    if (visibleTracksInput.value !== numOfVisTracks) visibleTracksInput.value = numOfVisTracks;
    playlistLim.style.setProperty('--visible-tracks', numOfVisTracks);
    localStorage.setItem('checked-visible-tracks-box', checkedVisibleTracksBox);
    localStorage.setItem('number_of_visible_tracks', numOfVisTracks);
}

///////////////////////////////////
// Initial scroll arrows opacity //
///////////////////////////////////

const scrollElemsOpacityInput = document.getElementById('scroll-elements-opacity');
let scrollElemsOpacity = localStorage.getItem('scroll_elements_opacity');

changeScrollElementsOpacity(scrollElemsOpacity);

scrollElemsOpacityInput.oninput = () => {
    let value = scrollElemsOpacityInput.value;
    changeScrollElementsOpacity(value);
};

function changeScrollElementsOpacity(value) {
    if (value == null) {
        value = DEFAULT_VALUES_DATA['scroll-elements-opacity'];
    } else {
        let minValue = +scrollElemsOpacityInput.min;
        let maxValue = +scrollElemsOpacityInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    scrollElemsOpacity = value;
    if (scrollElemsOpacityInput.value !== scrollElemsOpacity) scrollElemsOpacityInput.value = scrollElemsOpacity;
    localStorage.setItem('scroll_elements_opacity', scrollElemsOpacity);

    if (cursorOverPlaylist || mouseModeScrolling) showScrollElements();
}

///////////////////////////////
// Initial wheel scroll step //
///////////////////////////////

const wheelScrollStepInput = document.getElementById('wheel-scroll-step');
let wheelScrollStep = localStorage.getItem('wheel_scroll_step');

changeWheelScrollStep(wheelScrollStep);

wheelScrollStepInput.oninput = () => {
    let value = +wheelScrollStepInput.value;
    changeWheelScrollStep(value);
};

function changeWheelScrollStep(value) {
    if (value == null) {
        value = DEFAULT_VALUES_DATA['wheel-scroll-step'];
    } else {
        let minValue = +wheelScrollStepInput.min;
        let maxValue = +wheelScrollStepInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    wheelScrollStep = value;
    if (wheelScrollStepInput.value !== wheelScrollStep) wheelScrollStepInput.value = wheelScrollStep;
    localStorage.setItem('wheel_scroll_step', wheelScrollStep);
}

////////////////////////////
// Last played track info //
////////////////////////////

function showLastPlayedTrackInfo() {
    let cookies = document.cookie
        .split(';')
        .reduce((obj, cookie) => {
            let prop = cookie.trim().split('=');
            obj[prop[0]] = prop[1];
            return obj;
        }, {});

    let lastPlayedAudio = cookies['last_played_audio'] && decodeURIComponent(cookies['last_played_audio']);
    let lastPlayDate = cookies['date_of_last_play'];

    if (!lastPlayedAudio || !lastPlayDate) return;

    let allMillisecs = new Date() - new Date(lastPlayDate);
    let allSecs = Math.floor(allMillisecs / 1000);
    let allMins = Math.floor(allSecs / 60);
    let allHours = Math.floor(allMins / 60);

    let days = Math.floor(allHours / 24);
    let hours = Math.floor(allHours - days * 24);
    let mins = Math.floor(allMins - 60 * allHours);
    let secs = Math.floor(allSecs - 60 * allMins);

    let timeElapsed = '';
    if (days) timeElapsed += days + ' days ';
    if (hours) timeElapsed += hours + ' hours ';
    if (mins) timeElapsed += mins + ' minutes ';
    if (secs) timeElapsed += secs + ' seconds ';
    timeElapsed = timeElapsed.slice(0, timeElapsed.length - 1);

    let startInfo = `Last time you listened to the track
        <span class="track">"${lastPlayedAudio}"</span>
        <span class="time">${timeElapsed}</span> ago.`;

    displayInfo.innerHTML = startInfo;
    displayInfo.hidden = false;

    setTimeout(() => {
        displayInfo.style.opacity = 1;

        let transTime = parseFloat(getComputedStyle(displayInfo).transitionDuration) * 1000;

        setTimeout(() => {
            displayInfo.scrollTop = displayInfo.scrollHeight;
            
            setTimeout(() => {
                displayInfo.style.opacity = '';
    
                setTimeout(() => displayInfo.hidden = true, transTime);
            }, 1750);
        }, 1750 + transTime);
    }, 250);
}

function saveLastAudioInfo(audio) {
    let lastPlayedAudio = 'last_played_audio=' +
        encodeURIComponent(audio.dataset.artist + ' - ' + audio.dataset.title);
    let lastPlayDate = 'date_of_last_play=' + new Date();
    let dateExpires = new Date(Date.now() + 864000e3).toUTCString(); // Delete cookies after 10 days
    
    document.cookie = `${lastPlayedAudio}; path=/; expires=${dateExpires}`;
    document.cookie = `${lastPlayDate}; path=/; expires=${dateExpires}`;
}

/////////////////////////
// Selected track info //
/////////////////////////

function showTrackInfo(audio) {
    displayInfo.hidden = true;

    highlightSelected(audio);

    if (audio !== showTrackInfo.audio) {
        if (showTrackInfo.audio) {
            if (showTrackInfo.audio.paused) showTrackInfo.audio.onplaying = () => false;
            showTrackInfo.audio.onended = () => false;
            showTrackInfo.audio.onpause = () => false;
            showTrackInfo.audio.onwaiting = () => false;
            showTrackInfo.audio.onseeking = () => false;
        }

        showTrackInfo.audio = audio;

        audio.onplaying = () => {
            hideLoading(audio);
    
            if (audio === selectedAudio && playOn && !timePosSeeking) {
                console.log('playing | ' + audio.dataset.title);
    
                clearUpdTimers();
                audio.volume = settedVolume;
                indicator.classList.add('active');
    
                try {
                    audio.playbackRate = accelerationData[accelerationType].playbackRate;
                } catch(error) {
                    console.error(error.name + ': ' + error.message);
            
                    if (error.name === 'NotSupportedError') {
                        acceleratePlaying = false;
                        audio.pause();
                    }
                }
    
                runUpdTimers(audio);
                saveLastAudioInfo(audio);
            } else {
                console.log('pause after ready | ' + audio.dataset.title);
    
                audio.pause();
    
                if (audio !== selectedAudio) audio.onplaying = () => false;
            }
        };
        
        audio.onended = () => {
            if (timePosSeeking) return;
            if (timerFinishPlay) return;
            if (acceleration && accelerationType === 'fast-rewind') return;
    
            if (acceleration && accelerationType === 'fast-forward') {
                console.log(`track ended in ${accelerationType} | ${audio.dataset.title}`);
            } else if (!acceleration) {
                console.log('track ended | ' + audio.dataset.title);
            }
    
            finishTrack(audio);
        };

        audio.onpause = () => {
            indicator.classList.remove('active');
        };

        audio.onwaiting = () => {
            console.log('waiting | ' + audio.dataset.title);

            clearUpdTimers();
            showLoading(audio);
            audio.volume = 0;

            if (acceleration) runUpdTimers(audio);
        };
        
        audio.onseeking = () => {
            setTimeout(() => {
                //console.log('seeking... readyState = ' + audio.readyState);

                if (!audio.seeking) return;

                showLoading(audio);

                audio.onseeked = () => {
                    console.log('seeked! readyState = ' + audio.readyState + ' | ' + audio.dataset.title);

                    hideLoading(audio);

                    audio.onseeked = () => false;
                };
            }, LAG); // Audio ready state update delay
        };

        stopTitlesMoving();

        trackTitleDisplay.textContent = audio.dataset.title;
        artistNameDisplay.textContent = audio.dataset.artist;
        
        trackTitleDisplay.style.left = '';
        artistNameDisplay.style.left = '';

        moveTitles(trackTitleDisplay, artistNameDisplay);

        function moveTitles(...titles) {
            for (let title of titles) {
                let containerWidth = player.querySelector('.selected-track').offsetWidth;
                let titleWidth = title.offsetWidth;
                if (titleWidth <= containerWidth) return;

                title.style.left = 0;
        
                let timerTitleMove = setTimeout(() => {
                    let diffWidth = containerWidth - titleWidth;
                    let pos = 0;
        
                    timerTitleMove = requestAnimationFrame(function shiftTitle() {
                        title.style.left = --pos + 'px';
        
                        if (pos <= diffWidth) {
                            timerTitleMove = setTimeout(moveTitles, 1500, title);
                        } else {
                            timerTitleMove = requestAnimationFrame(shiftTitle);
                        }
                        titleMoveTimers[title.id + '-timer'] = timerTitleMove;
                    });
                    titleMoveTimers[title.id + '-timer'] = timerTitleMove;
                }, 1000);
                titleMoveTimers[title.id + '-timer'] = timerTitleMove;
            }
        }
    }
    
    if (audio.duration) {
        updateTime(audio);
        updateDuration(audio);
    } else {
        updateTime(null, '??:??');
        updateDuration(null, '??:??');

        audio.ondurationchange = () => {
            if (audio !== selectedAudio) return;

            updateDuration(audio);
            audio.currentTime = timelinePos * audio.duration / timeRange.offsetWidth;

            if (acceleration) {
                clearUpdTimers();
                runUpdTimers(audio);
            } else {
                updateTime(audio);
            }

            if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();
        };
    }

    updateTimeline(audio);
}

//////////////////////////////////
// Track time and position info //
//////////////////////////////////

timeRange.onpointerenter = enterTimeRange;

function enterTimeRange() {
    timeRangeEnter = true;

    let timeRangeRect = timeRange.getBoundingClientRect();

    timeRange.onpointermove = function(event) {
        let x = findXPos(event.clientX);
        let timeBarPos = (x < this.offsetWidth) ? x : x - 1;

        timeBar.style.left = timeBarPos + 'px';

        if (timePosSeeking) {
            timelinePos = x;
            updateTimePosition(timelinePos);
        }
    };

    timeRange.onpointerleave = function() {
        timeRangeEnter = false;
        timeBar.hidden = true;
        this.style.cursor = '';

        this.onpointermove = () => false;
        this.onpointerdown = () => false;
        this.onpointerleave = () => false;
    };

    if (!selectedAudio) return;

    timeBar.hidden = false;
    timeRange.style.cursor = 'pointer';

    timeRange.onpointerdown = function(event) {
        this.setPointerCapture(event.pointerId);
        document.getSelection().empty();

        clearFinPlayTimer();
        clearUpdTimers();

        if (playOn) {
            console.log('pause (pointer down on timeline) | ' + selectedAudio.dataset.title);

            pauseAudio(selectedAudio);
        }

        timePosSeeking = true;

        timelinePos = findXPos(event.clientX);
        updateTimePosition(timelinePos);

        this.onpointerup = function(event) {
            timePosSeeking = false;

            timelinePos = findXPos(event.clientX);
            updateTimePosition(timelinePos);

            if (playOn) {
                playAudio(selectedAudio);
            } else if (acceleration) {
                runUpdTimers(selectedAudio);
            }

            this.onpointerup = () => false;
        };
    };

    function findXPos(clientX) {
        let x = clientX - timeRangeRect.left;
        if (x < 0) x = 0;
        if (x > timeRange.offsetWidth) x = timeRange.offsetWidth;
        return x;
    }

    function updateTimePosition(xPos) {
        timeline.style.width = (TIMELINE_MARGIN + xPos) + 'px';

        if (selectedAudio.duration) {
            selectedAudio.currentTime = xPos * selectedAudio.duration / timeRange.offsetWidth;
            updateTime(selectedAudio);
        }
    }
}

function calcTimeRangeTooltip(xPos) {
    if (!selectedAudio) return;
    if (!selectedAudio.duration) return '??:??';

    let calculatedTime = xPos * selectedAudio.duration / timeRange.offsetWidth;

    let mins = Math.floor(calculatedTime / 60);
    let secs = Math.floor(calculatedTime - mins * 60);

    if (mins < 10) mins = '0' + mins;
    if (secs < 10) secs = '0' + secs;

    return calculatedTime = mins + ':' + secs;
}

/////////////////////////////
// Player controls - FW/RW //
/////////////////////////////

// Pointer step/acceleration handlers
for (let button of [rewindBtn, forwardBtn]) {
    let key = 'Pointer' + button.id[0].toUpperCase() + button.id.slice(1);

    button.onpointerdown = function(event) {
        this.setPointerCapture(event.pointerId);
        downKeyStepAccAction(key);
    };
    
    button.onpointerup = function() {
        upKeyStepAccAction(key);
    };
}

function downKeyStepAccAction(key) {
    if (document.activeElement.tagName == 'INPUT') return;

    activeStepAccKeys.add(key);

    clearTimeout(timerAccelerationDelay);

    let keyAccType = stepKeysData[key].accelerationType;

    if (keyAccType != accelerationType) {
        timerAccelerationDelay = setTimeout(() => {
            curAccelerateKey = key;

            canceledStepAccKeys.clear();
            activeStepAccKeys.forEach(activeKey => canceledStepAccKeys.add(activeKey));

            if (acceleration) stopAcceleration();
            accelerate(selectedAudio, keyAccType);
        }, ACCELERATION_DELAY);
    }
}

function upKeyStepAccAction(key) {
    if (!activeStepAccKeys.size) return;
    if (document.activeElement.tagName == 'INPUT') return;

    activeStepAccKeys.delete(key);

    clearTimeout(timerAccelerationDelay);

    if (activeStepAccKeys.size) {
        if (acceleration) {
            if (key == curAccelerateKey) {
                canceledStepAccKeys.clear();
                activeStepAccKeys.forEach(activeKey => canceledStepAccKeys.add(activeKey));
                
                let prevKey = curAccelerateKey = Array.from(activeStepAccKeys)[activeStepAccKeys.size - 1];
                let prevKeyAccType =  stepKeysData[prevKey].accelerationType;
                if (prevKeyAccType == accelerationType) return;

                stopAcceleration();
                accelerate(selectedAudio, prevKeyAccType);
            } else {
                if (!canceledStepAccKeys.has(key)) {
                    if (!timePosSeeking) stepKeysData[key]['step-function']();
                } else {
                    canceledStepAccKeys.delete(key);
                }
            }
        } else {
            if (!timePosSeeking) stepKeysData[key]['step-function']();
        }
    } else {
        if (acceleration) {
            stopAcceleration();
        } else {
            if (!timePosSeeking) stepKeysData[key]['step-function']();
        }

        curAccelerateKey = null;
        canceledStepAccKeys.clear();
    }
}

function endSteppingAccelerating() {
    clearTimeout(timerAccelerationDelay);

    if (acceleration) stopAcceleration();

    curAccelerateKey = null;
    activeStepAccKeys.clear();
    canceledStepAccKeys.clear();
}

function rewindAction() {
    if (!selectedAudio) {
        selectedAudio = orderedPlaylist[orderedPlaylist.length - 1];
        if (!selectedAudio) return;

        console.log('step-rewind track selecting | ' + selectedAudio.dataset.title);
        
        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        keepSelectedTitleVisible(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();
        return;
    }

    clearFinPlayTimer();
    clearUpdTimers();

    if (playOn) pauseAudio(selectedAudio);

    if (
        (selectedAudio.duration && selectedAudio.currentTime <= 3) ||
        (!selectedAudio.duration && !timelinePos)
    ) { 
        let idx = orderedPlaylist.findIndex(aud => aud === selectedAudio);
        let prevAudio = orderedPlaylist[--idx];
        
        removeSelected(selectedAudio);
        selectedAudio = (prevAudio) ? prevAudio : orderedPlaylist[orderedPlaylist.length - 1];
        setSelected(selectedAudio);

        console.log('step-rewind track selecting | ' + selectedAudio.dataset.title);

        keepSelectedTitleVisible(selectedAudio);
    } else {
        console.log('skip to start | ' + selectedAudio.dataset.title);
    }

    timelinePos = 0;
    selectedAudio.currentTime = 0;
    
    showTrackInfo(selectedAudio);
    if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();

    if (playOn) {
        playAudio(selectedAudio);
    } else if (acceleration) {
        runUpdTimers(selectedAudio);
    }
}

function forwardAction() {
    if (!selectedAudio) {
        selectedAudio = orderedPlaylist[0];
        if (!selectedAudio) return;

        console.log('step-forward track selecting | ' + selectedAudio.dataset.title);

        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        keepSelectedTitleVisible(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();
        return;
    }

    clearFinPlayTimer();
    clearUpdTimers();

    if (playOn) pauseAudio(selectedAudio);
    
    let idx = orderedPlaylist.findIndex(aud => aud === selectedAudio);
    let nextAudio = orderedPlaylist[++idx];

    removeSelected(selectedAudio);
    selectedAudio = (nextAudio) ? nextAudio : orderedPlaylist[0];
    setSelected(selectedAudio);

    console.log('step-forward track selecting | ' + selectedAudio.dataset.title);

    timelinePos = 0;
    selectedAudio.currentTime = 0;

    showTrackInfo(selectedAudio);
    keepSelectedTitleVisible(selectedAudio);
    if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();

    if (playOn) {
        playAudio(selectedAudio);
    } else if (acceleration) {
        runUpdTimers(selectedAudio);
    }
}

///////////////////////////////////////
// Player controls - Play/pause/stop //
///////////////////////////////////////

playPauseBtn.onclick = playPauseAction;

function playPauseAction() {
    if (!selectedAudio) {
        selectedAudio = orderedPlaylist[0];
        if (!selectedAudio) return;

        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        keepSelectedTitleVisible(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();
    } else {
        highlightSelected(selectedAudio);
    }

    clearFinPlayTimer();
    clearUpdTimers();

    if (!playOn) {
        console.log('play (knob) | ' + selectedAudio.dataset.title);

        setPlayState();
        playAudio(selectedAudio);
    } else {
        console.log('pause (knob) | ' + selectedAudio.dataset.title);

        setPauseState();
        pauseAudio(selectedAudio);
        if (acceleration && !timePosSeeking) runUpdTimers(selectedAudio);
    }
}

function pauseAudio(audio) {
    if (audio.readyState >= 3) {
        audio.pause();
        updateTime(audio);
    }
}

function playAudio(audio) { // playOn = true
    indicator.classList.remove('active');

    if (!audio.src) {
        audio.src = audio.dataset.source;

        if (acceleration) runUpdTimers(audio);

        setTimeout(() => {
            if (audio.duration) {
                console.log('+1');

                if (playOn && audio === selectedAudio) runPlaying(audio);
            } else {
                console.log('+2');

                showLoading(audio);

                audio.oncanplaythrough = () => {
                    console.log('can play (first play) | ' + audio.dataset.title);

                    hideLoading(audio);
                    if (playOn && audio === selectedAudio) runPlaying(audio);

                    audio.oncanplaythrough = () => false;
                };
            }
        }, LAG);
    } else {
        if (audio.duration && audio.paused) {
            console.log('+3');

            runPlaying(audio);
        } else if (acceleration) {
            console.log('+4');
    
            runUpdTimers(audio);
        }
    }

    function runPlaying(audio) {
        if (acceleration && accelerationType === 'fast-rewind' && audio.ended == true) {
            audio.currentTime = 0;
            audio.currentTime = audio.duration;
        }

        audio.volume = 0;
        audio.preservesPitch = false;
        acceleratePlaying = true;

        audio.play();

        audio.oncanplaythrough = () => false;
    }
}

stopBtn.onclick = stopAction;

function stopAction() {
    if (!selectedAudio) return;
    if (timerFinishPlay) return;

    console.log('stop (knob) | ' + selectedAudio.dataset.title);

    clearUpdTimers();
    if (playOn) pauseAudio(selectedAudio);
    finishPlaying();
}

function setPlayState() {
    playOn = true;
    playPauseBtn.className = 'icon-pause';
}

function setPauseState() {
    playOn = false;
    playPauseBtn.className = 'icon-play';
}

//////////////////
// Acceleration //
//////////////////

function accelerate(audio, accType) {
    if (!selectedAudio) return;

    console.log(`start ${accType} acceleration`);

    acceleration = true;
    accelerationType = accType;

    let button = accelerationData[accelerationType].button;

    for (let comparedAccType of Object.keys(accelerationData)) {
        let comparedButton = accelerationData[comparedAccType].button;
        if (!comparedButton) continue;

        comparedButton.className = (comparedButton == button) ?
            accelerationData[comparedAccType].classIcons.accOn :
            accelerationData[comparedAccType].classIcons.accOff;
    }

    clearFinPlayTimer();
    clearUpdTimers();

    try {
        audio.playbackRate = accelerationData[accelerationType].playbackRate;
    } catch(error) {
        console.error(error.name + ': ' + error.message);

        if (error.name === 'NotSupportedError') {
            acceleratePlaying = false;
            if (playOn && audio.readyState >= 3) audio.pause();
        }
    }

    console.log('playbackRate = ' + audio.playbackRate);

    if (!timePosSeeking) runUpdTimers(audio);
}

function stopAcceleration() {
    console.log(`stop ${accelerationType} acceleration`);

    clearTimeout(timerAccelerationDelay);
    clearUpdTimers();

    let button = accelerationData[accelerationType].button;
    button.className = accelerationData[accelerationType].classIcons.accOff;

    acceleratePlaying = true;
    acceleration = false;
    accelerationType = 'none';

    selectedAudio.playbackRate = accelerationData[accelerationType].playbackRate;

    updateTimeline(selectedAudio);

    if (playOn) {
        if (selectedAudio.paused) {
            playAudio(selectedAudio);
        } else if (selectedAudio.readyState >= 3) {
            runUpdTimers(selectedAudio);
        }
    } else {
        if (selectedAudio.duration) {
            updateTime(selectedAudio);
        }
    }
}

//////////////////////////////////////
// Updating track time and position //
//////////////////////////////////////

function updateTime(audio, displayStr) {
    if (audio) {
        console.log(audio.currentTime + ' | ' + audio.dataset.title);

        let mins = (roundTime) ?
            Math.floor(Math.round(audio.currentTime) / 60) :
            Math.floor(audio.currentTime / 60);
        let secs = (roundTime) ?
            Math.round(audio.currentTime - mins * 60) :
            Math.floor(audio.currentTime - mins * 60);
    
        if (mins < 10) mins = '0' + mins;
        if (secs < 10) secs = '0' + secs;

        let timeStr = mins + ':' + secs;

        for (let i = 0; i <= 4; i++) {
            curTimeDisplay.children[i].innerHTML = timeStr[i];
        }
    } else {
        for (let i = 0; i <= 4; i++) {
            curTimeDisplay.children[i].innerHTML = displayStr[i];
        }
    }
}

function updateDuration(audio, displayStr) {
    if (audio) {
        let mins = Math.floor(audio.duration / 60);
        let secs = Math.round(audio.duration - mins * 60);
    
        if (mins < 10) mins = '0' + mins;
        if (secs < 10) secs = '0' + secs;
    
        let timeStr = mins + ':' + secs;

        for (let i = 0; i <= 4; i++) {
            durationDisplay.children[i].innerHTML = timeStr[i];
        }
    } else {
        for (let i = 0; i <= 4; i++) {
            durationDisplay.children[i].innerHTML = displayStr[i];
        }
    }
}

function updateTimeline(audio) {
    let timelineWidth = (audio.duration) ?
        audio.currentTime / audio.duration * 100 :
        timelinePos / timeRange.offsetWidth * 100;
    
    timeline.style.width = `calc(${TIMELINE_MARGIN}px + ${timelineWidth}%)`;
}

function runUpdTimers(audio) {
    let rateFactor = (acceleration) ? ACCELERATION_FACTOR : 1;
    let timelineUpdInterval = TIMELINE_UPDATE_INTERVAL / rateFactor;
    let isTrackFinished;

    if (audio.duration) {
        runUpdCurTimeDisplay(audio);
        runUpdTimeline_isDuration(audio);
    } else {
        runUpdTimeline_noDuration(audio);
    }

    function runUpdCurTimeDisplay(audio) {
        updateTime(audio);

        let lastTime = Math.floor(audio.currentTime);

        requestCheckCurTime = requestAnimationFrame(function checkCurTime() {
            let curTime = Math.floor(audio.currentTime);

            if (curTime != lastTime) {
                updateTime(audio);
                lastTime = curTime;
            }

            requestCheckCurTime = requestAnimationFrame(checkCurTime);
        });
    }

    function runUpdTimeline_isDuration(audio) {
        let curTimeChangeStep = TIMELINE_UPDATE_INTERVAL / 1000;
        let isCurTimeChanging = acceleration && (!playOn || audio.readyState < 3 || !acceleratePlaying);

        timerTimelineUpd = setInterval(() => {
            if (isCurTimeChanging) {
                switch (accelerationType) {
                    case 'fast-forward':
                        audio.currentTime += curTimeChangeStep;
                        isTrackFinished = audio.currentTime >= audio.duration;
                        break;
                    case 'fast-rewind':
                        audio.currentTime -= curTimeChangeStep;
                        isTrackFinished = audio.currentTime <= 0;
                        break;
                }

                if (isTrackFinished) {
                    console.log(`track ended in ${accelerationType} (no playback) | ${audio.dataset.title}`);
                    
                    finishTrack(audio);
                }
            }

            updateTimeline(audio);
        }, timelineUpdInterval);
    }

    function runUpdTimeline_noDuration(audio) {
        let posPercent = timelinePos / timeRange.offsetWidth * 100;

        timerTimelineUpd = setInterval(() => {
            switch (accelerationType) {
                case 'fast-forward':
                    posPercent += TIMELINE_POSITION_CHANGE_STEP;
                    isTrackFinished = posPercent >= 100;
                    break;
                case 'fast-rewind':
                    posPercent -= TIMELINE_POSITION_CHANGE_STEP;
                    isTrackFinished = posPercent <= 0;
                    break;
            }

            timeline.style.width = `calc(${TIMELINE_MARGIN}px + calc(${posPercent}%)`;
            timelinePos = timeRange.offsetWidth * posPercent / 100;

            if (isTrackFinished) {
                console.log(`track ended in ${accelerationType} (no duration) | ${audio.dataset.title}`);

                finishTrack(audio);
            }
        }, timelineUpdInterval);
    }
}

////////////////////
// Finish playing //
////////////////////

function finishTrack(audio) {
    clearUpdTimers();

    roundTime = true;
    showTrackInfo(audio);
    roundTime = false;

    if (repeatBtn.dataset.repeat === 'track') {
        playFollowingAudio(audio);
    } else {
        let idx = orderedPlaylist.findIndex(aud => aud === audio);
        let followingAudio = (acceleration && accelerationType === 'fast-rewind') ?
            orderedPlaylist[--idx] :
            orderedPlaylist[++idx];

        if (followingAudio) {
            playFollowingAudio(followingAudio);
        } else {
            if (acceleration && accelerationType === 'fast-rewind') {
                followingAudio = orderedPlaylist[orderedPlaylist.length - 1];
                playFollowingAudio(followingAudio);
            } else {
                let shuffleInfo = shuffleBtn.classList.contains('active') ? 'shuffle ' : '';

                if (repeatBtn.dataset.repeat === 'playlist') {
                    console.log(`repeat ${shuffleInfo}playlist`);

                    followingAudio = orderedPlaylist[0];
                    playFollowingAudio(followingAudio);
                } else {
                    console.log(`${shuffleInfo}playlist ended`);

                    finishPlaying();
                }
            }
        }
    }

    function playFollowingAudio(followingAudio) {
        removeSelected(selectedAudio);
        selectedAudio = followingAudio;
        setSelected(selectedAudio);

        console.log('following track selecting | ' + selectedAudio.dataset.title);

        if (!acceleration || (acceleration && accelerationType === 'fast-forward')) {
            timelinePos = 0;
            selectedAudio.currentTime = 0;
        } else if (acceleration && accelerationType === 'fast-rewind') { 
            timelinePos = timeRange.offsetWidth;
            if (selectedAudio.duration) selectedAudio.currentTime = selectedAudio.duration;
        }

        showTrackInfo(selectedAudio);
        keepSelectedTitleVisible(selectedAudio);

        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();

        if (playOn) {
            playAudio(selectedAudio);
        } else if (acceleration) {
            runUpdTimers(selectedAudio);
        }
    }
}

function finishPlaying() {
    console.log('finish playing');

    endSteppingAccelerating();
    setPauseState();
    stopTitlesMoving();

    timerFinishPlay = setTimeout(() => {
        acceleratePlaying = true;
        acceleration = false;
        accelerationType = 'none';

        trackTitleDisplay.textContent = '';
        artistNameDisplay.textContent = '';

        updateTime(null, '--:--');
        updateDuration(null, '--:--');

        timeline.style.width = `${TIMELINE_MARGIN}px`;
        timeRange.style.cursor = '';
        timeBar.hidden = true;

        timelinePos = 0;
        defaultPlaylist.forEach(aud => aud.currentTime = 0);

        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.dismissTask();
        
        if (showTrackInfo.audio.paused) selectedAudio.onplaying = () => false;
        selectedAudio.onended = () => false;
        selectedAudio.onpause = () => false;
        selectedAudio.onwaiting = () => false;
        selectedAudio.onseeking = () => false;

        removeSelected(selectedAudio);

        curPlaylist.select();
        curPlaylist.setSelectionRange(0, 0);
        curPlaylist.blur();
        curPlaylist.scrollTop = 0;

        delete showTrackInfo.audio;
        selectedAudio = undefined;

        clearFinPlayTimer();
    }, PLAYLIST_FINISH_DELAY);
}

//////////////////
// Clear timers //
//////////////////

function clearUpdTimers() {
    cancelAnimationFrame(requestCheckCurTime);
    clearInterval(timerTimelineUpd);
}

function stopTitlesMoving() {
    for (let key in titleMoveTimers) {
        cancelAnimationFrame(titleMoveTimers[key]);
        clearInterval(titleMoveTimers[key]);
        delete titleMoveTimers[key];
    }
}

function clearFinPlayTimer() {
    clearTimeout(timerFinishPlay);
    timerFinishPlay = null;
}

/////////////////////
// Shuffle / Repeat //
/////////////////////

playerControls.onpointerover = function(event) {
    let btnContainer = event.target.closest('.btn-img-wrapper');
    if (!btnContainer) return;

    let button = btnContainer.firstElementChild;

    button.classList.add('hover');

    btnContainer.onclick = () => {
        switch (button.id) {
            case 'shuffle':
                shuffleAction();
                break;
            case 'repeat':
                repeatAction();
                break;
        }
    };

    btnContainer.onpointerout = () => {
        button.classList.remove('hover');

        btnContainer.onpointerout = () => false;
        btnContainer.onclick = () => false;
    };
};

function shuffleAction() {
    shuffleBtn.classList.toggle('active');

    if (shuffleBtn.classList.contains('active')) {
        console.log('create random playlist');

        randomizePlaylist(orderedPlaylist);
    } else {
        console.log('set default playlist');

        setDefaultPlaylist(defaultPlaylist);
    }

    if (selectedAudio) {
        highlightSelected(selectedAudio);
    } else {
        curPlaylist.scrollTop = 0;
    }
};

function repeatAction() {
    const repeatImg = repeatBtn.firstElementChild;
    const repeatStates = ['none', 'playlist', 'track'];
    let idx = repeatStates.indexOf(repeatBtn.dataset.repeat);
    let repeat = repeatStates[idx + 1] || repeatStates[0];

    repeatBtn.setAttribute('data-repeat', repeat);

    console.log('repeat: ' + repeatBtn.dataset.repeat);

    switch (repeat) {
        case 'none':
            repeatBtn.classList.remove('active');
            repeatImg.src = 'img/icons/repeat_playlist.png';
            repeatImg.alt = 'Repeat Playlist';
            break;
        case 'playlist':
            repeatBtn.classList.add('active');
            repeatImg.src = 'img/icons/repeat_playlist.png';
            repeatImg.alt = 'Repeat Playlist';
            break;
        case 'track':
            repeatBtn.classList.add('active');
            repeatImg.src = 'img/icons/repeat_track.png';
            repeatImg.alt = 'Repeat Track';
            break;
    }
}

function setDefaultPlaylist(audios) {
    orderedPlaylist.length = 0;

    let playlistText = 'Current playlist (default):\n\n';

    audios.forEach((audio, idx, array) => {
        orderedPlaylist.push(audio);
        playlistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
        if (audio.dataset.dub) playlistText += ' (' + audio.dataset.dub + ')';
        if (array[array.length - 1] != audio) playlistText += '\n';
    });

    breakLine(playlistText);
}

function randomizePlaylist(audios) {
    shuffle(audios);

    if (selectedAudio) {
        audios.map((aud, idx) => {
            if (aud === selectedAudio) {
                [audios[0], audios[idx]] = [audios[idx], audios[0]];
            }
        });
    }

    let playlistText = 'Current playlist (shuffle):\n\n';

    audios.forEach((audio, idx, array) => {
        playlistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
        if (audio.dataset.dub) playlistText += ' (' + audio.dataset.dub + ')';
        if (array[array.length - 1] != audio) playlistText += '\n';
    });

    breakLine(playlistText);

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));

            [array[i], array[j]] = [array[j], array[i]];
        }
    
        return array;
    }
}

function breakLine(playlistText) {
    let cols = curPlaylist.cols;
    let strings = playlistText.split(/\n/);
    
    fixedPlaylistStrings.clear();

    for (let str of strings) {
        let fixedStr = '';
        let shiftLength = 0;

        while (str.length + shiftLength - fixedStr.length > cols) {
            let startIdx = fixedStr.length - shiftLength;
            let endIdx = startIdx + cols;
            let subStr = str.slice(startIdx, endIdx);

            if (subStr.at(0) == ' ') {
                shiftLength--;
                continue;
            }

            let spaceIdx = subStr.lastIndexOf(' ');
            if (spaceIdx == -1) {
                spaceIdx = subStr.length;
                shiftLength++;
            }

            subStr = subStr.slice(0, spaceIdx) + '\n';
            fixedStr += subStr;
        }

        fixedStr += str.slice(fixedStr.length - shiftLength);
        fixedStr = fixedStr.replace(/\n\s/, '\n');
        if (str != strings.at(-1)) fixedStr += '\n';

        fixedPlaylistStrings.set(str, fixedStr);
    }

    curPlaylist.value = '';

    for (let str of fixedPlaylistStrings.keys()) {
        curPlaylist.value += fixedPlaylistStrings.get(str);
    }
}

////////////
// Volume //
////////////

function changeVolumeAction(command, keyRepeat) {
    if (settedVolume && !keyRepeat) savedVolume = settedVolume;

    let step = 2;
    let xPos = settedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);

    xPos += (command == 'increase') ? step : ((command == 'reduce') ? -step : 0);

    let volumePos = moveVolumeAt(xPos);
    setVolume(volumePos);
    showVolumeIcon(settedVolume);

    if (volumeRangeHoverIntent.elemRect) volumeRangeHoverIntent.executeTask();

    if (settedVolume) {
        volumeBar.classList.add('active');
    } else {
        volumeBar.classList.remove('active');
    }
}

volumeBtn.onclick = volumeAction;

function volumeAction() {
    if (volumeBtn.classList.contains('active')) {
        savedVolume = settedVolume;
        settedVolume = 0;
        if (selectedAudio) selectedAudio.volume = settedVolume;

        volumeBar.classList.remove('active');
        volumeBtn.className = 'icon-volume-off';

        volumeline.style.width = volumeBar.offsetWidth / 2 + 'px';
        volumeBar.style.left = 0;
    } else {
        settedVolume = savedVolume;
        if (selectedAudio) selectedAudio.volume = settedVolume;

        volumeBar.classList.add('active');
        showVolumeIcon(settedVolume);

        let volumePos = settedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);
        volumeline.style.width = volumePos + volumeBar.offsetWidth / 2 + 'px';
        volumeBar.style.left = volumePos + 'px';
    }
}

volumeRange.onpointerdown = function(event) {
    if (settedVolume) savedVolume = settedVolume;

    volumeBar.setPointerCapture(event.pointerId);

    let volumeRangeRect = this.getBoundingClientRect();

    changeVolume(event.clientX);

    volumeBar.onpointermove = (event) => changeVolume(event.clientX);

    volumeBar.onpointerup = () => {
        if (!settedVolume) volumeBar.classList.remove('active');

        volumeBar.onpointermove = () => false;
        volumeBar.onpointerup = () => false;
    };

    function changeVolume(clientX) {
        volumeBar.classList.add('active');

        let xPos = clientX - volumeRangeRect.left - volumeBar.offsetWidth / 2;
        let volumePos = moveVolumeAt(xPos);
        setVolume(volumePos);
        showVolumeIcon(settedVolume);
    }
};

function moveVolumeAt(x) {
    if (x < 0) x = 0;
    if (x > volumeRange.offsetWidth - volumeBar.offsetWidth) {
        x = volumeRange.offsetWidth - volumeBar.offsetWidth;
    }

    volumeline.style.width = x + volumeBar.offsetWidth / 2 + 'px';
    volumeBar.style.left = x + 'px';

    return x;
}
    
function setVolume(pos) {
    settedVolume = pos / (volumeRange.offsetWidth - volumeBar.offsetWidth);
    localStorage.setItem('player_volume', settedVolume);

    if (selectedAudio) selectedAudio.volume = settedVolume;
}

function showVolumeIcon(vol) {
    volumeBtn.className = (vol == 0) ? 'icon-volume-off' :
        (vol <= 0.5) ? 'icon-volume-down active' :
        (vol <= 0.9) ? 'icon-volume active' :
        'icon-volume-up active';
}

function calcVolumeTooltip() {
    let calculatedVolume = (settedVolume * 100).toFixed(0) + '%';
    return calculatedVolume;
}

//////////////
// Playlist //
//////////////

playlist.onpointerover = (event) => {
    if (event.target.tagName != 'SPAN') return;

    let trackTitle = event.target;
    let titleWidth = trackTitle.offsetWidth;
    let titleLeft = trackTitle.getBoundingClientRect().left;
    let playlistLimLeft = playlistLim.getBoundingClientRect().left;
    let windowClientWidth = document.documentElement.clientWidth;

    if (titleLeft - playlistLimLeft + titleWidth > playlistLim.offsetWidth) {
        playlistLim.style.width = titleLeft - playlistLimLeft + titleWidth + 'px';
    }
    if (titleLeft + titleWidth > windowClientWidth) {
        playlistLim.style.width = windowClientWidth - playlistLimLeft + 'px';
    }

    trackTitle.parentElement.classList.add('hover');
    
    trackTitle.onpointerleave = () => {
        trackTitle.parentElement.classList.remove('hover');
        playlistLim.style.width = '';

        trackTitle.onpointerleave = () => false;
    };
};

playlist.onclick = function(event) {
    let title = event.target;
    if (title.tagName != 'SPAN') return;

    if (document.getSelection().toString().length) return;

    let newAudio = title.closest('.track').querySelector('audio');
    if (!newAudio || newAudio.tagName != 'AUDIO') return;

    setPlayState();
    
    if (!selectedAudio) {
        selectedAudio = newAudio;
        
        console.log('playlist track selecting | ' + newAudio.dataset.title);

        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        playAudio(selectedAudio);
        return;
    }
    
    clearFinPlayTimer();
    clearUpdTimers();

    if (playOn) pauseAudio(selectedAudio);

    if (newAudio != selectedAudio) {
        removeSelected(selectedAudio);
        selectedAudio = newAudio;
        setSelected(selectedAudio);
    }

    console.log('playlist track selecting | ' + newAudio.dataset.title);

    timelinePos = 0;
    selectedAudio.currentTime = 0;

    showTrackInfo(selectedAudio);
    keepSelectedTitleVisible(selectedAudio);
    playAudio(selectedAudio);
};

playlist.oncontextmenu = function(event) {
    if (event.target.tagName != 'SPAN') return;

    event.preventDefault();

    let trackMenu = document.createElement('div');
    trackMenu.className = 'track-menu';
    player.appendChild(trackMenu);
    
    let downloadLink = document.createElement('div');
    downloadLink.innerHTML = 'Save audio in MP3';
    trackMenu.appendChild(downloadLink);

    let playerRect = player.getBoundingClientRect(); // player - parent element for trackMenu

    let x = event.clientX - playerRect.left;
    if (x > (document.documentElement.clientWidth - playerRect.left - trackMenu.offsetWidth)) {
        x = document.documentElement.clientWidth - playerRect.left - trackMenu.offsetWidth;
    }
    trackMenu.style.left = x + 'px';

    let y = event.clientY - playerRect.top;
    if (y > (document.documentElement.clientHeight - playerRect.top - trackMenu.offsetHeight)) {
        y = document.documentElement.clientHeight - playerRect.top - trackMenu.offsetHeight;
    }
    trackMenu.style.top = y + 'px';

    let audio = event.target.closest('.track').querySelector('audio');

    downloadLink.addEventListener('click', () => {
        let loadInfoElem = audio.parentElement.querySelector('.load-info');
        if (loadInfoElem) loadInfoElem.remove();

        downloadAudio(audio);
        trackMenu.remove();
    });
        
    document.addEventListener('pointerdown', function(event) {
        if (event.target.closest('.track-menu')) return;
        trackMenu.remove();
    });

    async function downloadAudio(audio) {
        let trackElem = audio.parentElement;
            
        let loadInfoElem = document.createElement('div');
        loadInfoElem.className = 'load-info';
        trackElem.appendChild(loadInfoElem);

        let progressElem = document.createElement('div');
        progressElem.className = 'progress';
        loadInfoElem.appendChild(progressElem);

        let statusElem = document.createElement('div');
        statusElem.className = 'status';
        statusElem.innerHTML = 'Waiting for loading...';
        progressElem.appendChild(statusElem);

        let displayProgressElem = document.createElement('div');
        displayProgressElem.className = 'display-progress';
        displayProgressElem.innerHTML = '0%';
        loadInfoElem.appendChild(displayProgressElem);

        let url = audio.dataset.source;
        let response = await fetch(url);
    
        if (response.ok) {
            statusElem.innerHTML = 'Loading...';

            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let binaryData = new Uint8Array(contentLength);
            let receivedLength = 0;
        
            while(true) {
                const {done, value} = await reader.read();
                if (done) break;
        
                binaryData.set(value, receivedLength);
                receivedLength += value.length;

                let receivedPercent = receivedLength / contentLength * 100;
                progressElem.style.width = `calc(${receivedPercent}%)`;
                displayProgressElem.innerHTML = Math.floor(receivedPercent) + '%';
            }

            if (receivedLength === contentLength) statusElem.innerHTML = 'Complete download!';

            let audioBlob = new Blob([binaryData], {type: 'audio/mpeg'});
            let audioName = audio.dataset.artist + ' - ' + audio.dataset.title + '.mp3';

            orderedDownloads.push(() => saveFile(audioBlob, audioName));
            if (orderedDownloads.length == 1) orderedDownloads[0]();

            async function saveFile(blob, fileName) {
                // Обнаружение поддержки браузером File System Access API.
                // API должен поддерживаться и приложение не запущено в iframe.
                const supportsFileSystemAccess =
                    'showSaveFilePicker' in window &&
                    (() => {
                        try {
                            return window.self === window.top;
                        } catch {
                            return false;
                        }
                    })();

                if (supportsFileSystemAccess) { // File System Access API поддерживается…
                    try {
                        // Показать диалог сохранения файла.
                        let handle = await window.showSaveFilePicker({
                            suggestedName: fileName
                        });
                        
                        // Записать blob в файл.
                        let writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();

                        statusElem.innerHTML = 'Audio file is saved!';
                        hideLoadStatus();
                        return;
                    } catch (err) {
                        console.error(err.name + ': ' + err.message);

                        if (err.name === 'AbortError') { // Отмена скачивания файла, не предлагать второй вариант
                            statusElem.innerHTML = 'Audio file saving canceled';
                            hideLoadStatus();
                            return;
                        }

                        if (err.name === 'SecurityError') {
                            console.log('File System Access API не работает при длительной загрузке файла. ' + 
                                'Осуществлён метод загрузки через ссылку.');
                        }
                    }
                }

                // Доступ API к файловой системе не поддерживается или ошибка в процессе => Загрузка через ссылку
                let audioLink = document.createElement('a');
                audioLink.download = fileName;
                audioLink.href = URL.createObjectURL(blob);
                audioLink.click();
                URL.revokeObjectURL(audioLink.href);

                window.addEventListener('focus', hideLoadStatus);

                
            }
        } else {
            alert("Download error! Response status: " + response.status);

            statusElem.innerHTML = 'Download failed';
            hideLoadStatus();
        }

        function hideLoadStatus() {
            loadInfoElem.style.opacity = 0;

            let hideTime = parseInt(getComputedStyle(loadInfoElem).transitionDuration) * 1000;
            setTimeout(() => loadInfoElem.remove(), hideTime);

            orderedDownloads.shift();
            if (orderedDownloads.length) orderedDownloads[0]();

            window.removeEventListener('focus', hideLoadStatus);
        }
    }
};

////////////////////////
// Playlist scrolling //
////////////////////////

playlistLim.onpointerenter = () => {
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;

    cursorOverPlaylist = true;
    clearTimeout(timerHideScrollElements);

    showScrollElements();

    if (playlistLim.scrollTop) {
        scrollArrowUp.classList.remove('inactive');
    } else {
        scrollArrowUp.classList.add('inactive');
    }

    if (playlistLim.scrollHeight - playlistLim.scrollTop > playlistLim.clientHeight) {
        scrollArrowDown.classList.remove('inactive');
    } else {
        scrollArrowDown.classList.add('inactive');
    }
};

playlistLim.onpointerleave = () => {
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;

    cursorOverPlaylist = false;
    if (mouseModeScrolling || activeScrollKeys.size) return;

    hideScrollElements();
};

playlistLim.onwheel = (event) => {
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;
    event.preventDefault();
    
    let direction = (event.deltaY > 0) ? 'down' : 'up';
    let deltaHeight = titleHeight * wheelScrollStep;

    scrollPlaylist({direction, deltaHeight, wheel: true});
};

playlistLim.onpointerdown = (event) => {
    if (event.button != 1) return;
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;
    event.preventDefault();
    if (mouseModeScrolling) return;

    mouseModeScrolling = true;

    let cursorScrollStyles = '<link rel="stylesheet" href="styles/scrolling-cursors.css" type="text/css">';
    document.querySelector('head').insertAdjacentHTML('beforeend', cursorScrollStyles);
    document.body.classList.add('mouse-scroll-mode');

    scrollInMouseMode.centerY = scrollInMouseMode.currentY = event.clientY;
    scrollInMouseMode.stop = true;

    document.addEventListener('pointermove', setCurrentY);
    
    function setCurrentY(event) {
        scrollInMouseMode.currentY = event.clientY;
    }

    requestScrollInMouseMode = requestAnimationFrame(scrollInMouseMode);

    setTimeout(() => { // Cancellation mouseModeScrolling
        document.addEventListener('pointerdown', function cancelmouseScrolling(event) {
            event.preventDefault();

            mouseModeScrolling = false;

            cancelAnimationFrame(requestScrollInMouseMode);

            if (playlistLim.scrollTop % titleHeight) {
                let duration = 400 / scrollInMouseMode.deltaHeight;

                scrollPlaylist({duration});
            }

            if (!event.target.closest('#playlist-limiter') && !activeScrollKeys.size) {
                hideScrollElements();
            }

            document.querySelector('head > link[href="styles/scrolling-cursors.css"]').remove();
            document.body.classList.remove('mouse-scroll-mode');
            document.body.classList.remove('scroll-up');
            document.body.classList.remove('scroll-down');

            delete scrollInMouseMode.centerY;
            delete scrollInMouseMode.currentY;
            delete scrollInMouseMode.lastCurrentY;
            delete scrollInMouseMode.deltaHeight;
            delete scrollInMouseMode.stop;
        
            document.removeEventListener('pointermove', setCurrentY);
            document.removeEventListener('pointerdown', cancelmouseScrolling);
        });
    });
};

function scrollInMouseMode() {
    let centerY = scrollInMouseMode.centerY;
    let currentY = scrollInMouseMode.currentY;
    let lastCurrentY = scrollInMouseMode.lastCurrentY;
    let sensingDistance = 30;
    let direction;

    if (currentY <= centerY - sensingDistance) {
        direction = 'up';
        document.body.classList.remove('scroll-down');
        document.body.classList.add('scroll-up');
    } else if (currentY >= centerY + sensingDistance) {
        direction = 'down';
        document.body.classList.remove('scroll-up');
        document.body.classList.add('scroll-down');
    } else {
        document.body.classList.remove('scroll-up');
        document.body.classList.remove('scroll-down');
    }

    if (direction) scrollPlaylist.direction = direction;

    if ( // No scrolling action
        !direction ||
        (direction == 'up' && !playlistLim.scrollTop) ||
        (direction == 'down' && playlistLim.scrollHeight - playlistLim.scrollTop == playlistLim.clientHeight)
    ) {
        checkReachingPlaylistLimits(direction);

        // Aligning
        if (
            !direction &&
            (currentY != lastCurrentY) &&
            (Math.abs(lastCurrentY - centerY) >= sensingDistance)
        ) {
            let duration = 400 / scrollInMouseMode.deltaHeight;

            scrollPlaylist({duration});

            scrollInMouseMode.stop = true;
        }

        scrollInMouseMode.lastCurrentY = currentY;
        requestScrollInMouseMode = requestAnimationFrame(scrollInMouseMode);
    } else { // Scrolling in progress
        if (scrollInMouseMode.stop) cancelAnimationFrame(requestAnimateScrolling);
        activateScrollArrows();

        let range = 200;
        let maxDeltaHeight = playlistLim.scrollHeight / 30;
        if (maxDeltaHeight < 40) maxDeltaHeight = 40;
        let maxSpeed = 1;
        let minSpeed = maxSpeed / maxDeltaHeight;
        let y = Math.abs(centerY - currentY) - sensingDistance;
        let speed = minSpeed + (maxSpeed - minSpeed) * (y / range) ** 3;
        if (speed > maxSpeed) speed = maxSpeed;
        let deltaHeight = scrollInMouseMode.deltaHeight = maxDeltaHeight * speed;

        playlistLim.scrollTop += (direction == 'down') ? deltaHeight : ((direction == 'up') ? -deltaHeight : 0);

        scrollInMouseMode.stop = false;
        scrollInMouseMode.lastCurrentY = currentY;
        requestScrollInMouseMode = requestAnimationFrame(scrollInMouseMode);
    }
}

function keepSelectedTitleVisible(audio) {
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;

    let initScrolled = playlistLim.scrollTop;
    let visibleHeight = playlistLim.clientHeight;
    let selectedTrackTop = defaultPlaylist.indexOf(audio) * titleHeight;
    let direction, deltaHeight;

    if (selectedTrackTop + titleHeight > initScrolled + visibleHeight) {
        direction = 'down';
        deltaHeight = titleHeight + selectedTrackTop - (initScrolled + visibleHeight);
    }

    if (selectedTrackTop < initScrolled) {
        direction = 'up';
        deltaHeight = initScrolled - selectedTrackTop;
    }

    if (direction && deltaHeight) { // The track title IS NOT in the visible area of the playlist
        scrollPlaylist({direction, deltaHeight, align: false, hide: true});
    } else {
        cancelAnimationFrame(requestAnimateScrolling);

        if (initScrolled % titleHeight) scrollPlaylist({hide: true});
    }
}

function downKeyScrollAction(key) {
    if (playlistLim.scrollHeight == playlistLim.offsetHeight) return;
    if (document.activeElement.scrollHeight > document.activeElement.offsetHeight) return;
    if (document.activeElement.tagName == 'INPUT') return;

    activeScrollKeys.add(key);
    if (activeScrollKeys.size > 1) keyRepeating = true;

    cancelAnimationFrame(requestScrollOnKeyRepeat);
    showScrollElements();

    if (!keyRepeating || key == 'Home' || key == 'End') {
        let direction = scrollingKeysData[key].direction;
        let deltaHeight = scrollingKeysData[key].deltaHeight();
        let duration = scrollingKeysData.duration;
        let align = (key == 'Home' || key == 'End') ? false : true;

        scrollPlaylist({direction, deltaHeight, duration, align, hide: true});
    } else {
        cancelAnimationFrame(requestAnimateScrolling);
        activateScrollArrows();

        requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
    }
}

function repeatKeyScrollAction() {
    if (!activeScrollKeys.size) return;

    keyRepeating = true;

    cancelAnimationFrame(requestAnimateScrolling);
    cancelAnimationFrame(requestScrollOnKeyRepeat);

    requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
}

function upKeyScrollAction(key) {
    if (!activeScrollKeys.size) return;

    activeScrollKeys.delete(key);

    cancelAnimationFrame(requestScrollOnKeyRepeat);

    let duration = scrollingKeysData.duration;

    if (activeScrollKeys.size) {
        let prevKey = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];

        if (prevKey == 'Home' || prevKey == 'End') {
            let direction = scrollingKeysData[prevKey].direction;
            let deltaHeight = scrollingKeysData[prevKey].deltaHeight();

            scrollPlaylist({direction, deltaHeight, duration, align: false, hide: true});
        } else {
            cancelAnimationFrame(requestAnimateScrolling);

            requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
        }
    } else { // Last active scroll key
        let direction = scrollingKeysData[key].direction;
        let isStopScrolling = checkReachingPlaylistLimits(direction);

        if (isStopScrolling && !cursorOverPlaylist && !mouseModeScrolling) {
            hideScrollElements();
        }

        // Aligning
        if (keyRepeating && key != 'Home' && key != 'End') {
            scrollPlaylist({direction, duration, hide: true});
        }

        keyRepeating = false;
    }
}

function scrollOnKeyRepeat() {
    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let direction = scrollingKeysData[key].direction;
    let isStopScrolling = checkReachingPlaylistLimits(direction);
    if (isStopScrolling) return;

    activateScrollArrows();

    let factor = scrollingKeysData[key].factor;
    let deltaHeight = 10 * factor;

    playlistLim.scrollTop += (direction == 'down') ? deltaHeight : ((direction == 'up') ? -deltaHeight : 0);

    isStopScrolling = checkReachingPlaylistLimits(direction);
    if (isStopScrolling) return;

    requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
}

function endScrolling() {
    setTimeout(() => {
        if (!activeScrollKeys.size) return;

        cancelAnimationFrame(requestScrollOnKeyRepeat);

        let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
        let direction = scrollingKeysData[key].direction;
        let duration = scrollingKeysData.duration;

        activeScrollKeys.clear();
        keyRepeating = false;

        scrollPlaylist({direction, duration, hide: true});
    });
}

function scrollPlaylist(options) {
    options = Object.assign(
        {
            direction: scrollPlaylist.direction,
            deltaHeight: 0,
            duration: 150,
            wheel: false,
            align: true,
            hide: false
        },
        options
    );

    let {direction, deltaHeight, duration, align, wheel, hide} = options;

    if (hide) {
        clearTimeout(timerHideScrollElements);

        timerHideScrollElements = setTimeout(() => {
            if (cursorOverPlaylist || mouseModeScrolling || activeScrollKeys.size) return;

            hideScrollElements();
        }, 500);
    }

    let isStopScrolling = checkReachingPlaylistLimits(direction);
    if (isStopScrolling) return;

    cancelAnimationFrame(requestAnimateScrolling);

    showScrollElements();
    activateScrollArrows();

    scrollPlaylist.direction = direction;
    
    let initScrolled = playlistLim.scrollTop;
    let remainderRatio = (initScrolled % titleHeight) / titleHeight;

    if (remainderRatio && align) {
        let k = (wheel) ? 1 : 0;

        if (direction == 'down') {
            deltaHeight += titleHeight * (k + 1 - remainderRatio);
        }
        if (direction == 'up') {
            deltaHeight += titleHeight * (k + remainderRatio);
        }
    }

    let startTime = performance.now();
    
    requestAnimateScrolling = requestAnimationFrame(function animateScrolling(time) {
        let timeFraction = (time - startTime) / duration;
        if (timeFraction < 0) {
            requestAnimateScrolling = requestAnimationFrame(animateScrolling);
            return;
        }
        if (timeFraction > 1) timeFraction = 1;
    
        let progress = timing(timeFraction);
        
        function timing(timeFraction) {
            return timeFraction;
        }
    
        if (direction == 'down') {
            playlistLim.scrollTop = initScrolled + deltaHeight * progress;
        }
        if (direction == 'up') {
            playlistLim.scrollTop = initScrolled - deltaHeight * progress;
        }
    
        if (timeFraction < 1) {
            let isStopScrolling = checkReachingPlaylistLimits(direction);
            if (isStopScrolling) return;

            requestAnimateScrolling = requestAnimationFrame(animateScrolling);
        } else {
            checkReachingPlaylistLimits(direction);
        }
    });
}

function checkReachingPlaylistLimits(direction) {
    if (direction == 'up' && playlistLim.scrollTop == 0) {
        scrollArrowUp.classList.add('inactive');
        return true;
    }
    if (direction == 'down' && playlistLim.scrollHeight - playlistLim.scrollTop == playlistLim.clientHeight) {
        scrollArrowDown.classList.add('inactive');
        return true;
    }
    return false;
}

function activateScrollArrows() {
    scrollArrowUp.classList.remove('inactive');
    scrollArrowDown.classList.remove('inactive');
}

function showScrollElements() {
    scrollArrowUp.style.opacity = scrollElemsOpacity / 100;
    scrollArrowDown.style.opacity = scrollElemsOpacity / 100;
}

function hideScrollElements() {
    scrollArrowUp.style.opacity = 0;
    scrollArrowDown.style.opacity = 0;
}

//////////////////
// Track titles //
//////////////////

function hideLoading(audio) {
    audio.closest('.track').querySelector('.loading-figure').hidden = true;
    audio.closest('.track').querySelector('.screen-limiter').classList.remove('loading');
}
function showLoading(audio) {
    audio.closest('.track').querySelector('.loading-figure').hidden = false;
    audio.closest('.track').querySelector('.screen-limiter').classList.add('loading');

    indicator.classList.remove('active');
}

function setSelected(audio) {
    audio.closest('.track').querySelector('.screen-limiter').classList.add('selected');
    audio.closest('.track').querySelector('.author-title').classList.add('selected');
}
function removeSelected(audio) {
    audio.closest('.track').querySelector('.screen-limiter').classList.remove('selected');
    audio.closest('.track').querySelector('.author-title').classList.remove('selected');
}

///////////////////////////
// Player footer buttons //
///////////////////////////

configBtn.onclick = () => {
    let idx = configsBank.indexOf(config);
    changeConfig(idx + 1);
}

colorBtn.onclick = () => {
    let colorIdx = playerColorsBank.indexOf(playerColor);
    changePlayerColor(colorIdx + 1);
};

playlistStyleBtn.onclick = () => {
    let idx = playlistStylesBank.indexOf(playlistStyle);
    changePlaylistStyle(idx + 1);
};

settingsBtn.onclick = settingsAction;

infoBtn.onclick = showModalArea;

///////////////////
// Settings area //
///////////////////

function settingsAction() {
    settingsArea.classList.toggle('active');

    if (settingsArea.classList.contains('active')) {
        showSettings();
    } else {
        hideSettings();
    }
}

function showSettings() {
    clearTimeout(timerSettingsArea);
    settingsArea.hidden = false;
    if (selectedAudio) highlightSelected(selectedAudio);

    setTimeout(() => settingsArea.classList.add('active'));
}

function hideSettings() {
    clearTimeout(timerSettingsArea);
    settingsArea.classList.remove('active');

    let transTime = parseFloat(getComputedStyle(settingsArea).transitionDuration) * 1000;
    timerSettingsArea = setTimeout(() => settingsArea.hidden = true, transTime);
}

closeSetBtn.onclick = hideSettings;

function highlightSelected(audio) {
    // Searching
    let artist = audio.dataset.artist.replace(/\p{P}/gu, '\\$&');
    let title = audio.dataset.title.replace(/\p{P}/gu, '\\$&');
    let dub = (audio.dataset.dub) ? ` \\(${audio.dataset.dub}\\)` : '';
    let regexp = new RegExp(`\\d+\\.\\s${artist}\\s\u2013\\s${title}${dub}`);
    let fixedStr;

    for (let str of fixedPlaylistStrings.keys()) {
        if (str.match(regexp)) {
            if (!dub) {
                let matchStringEnd = str.match(/\s\(\d+\)$/);
                if (matchStringEnd) continue;
            }

            fixedStr = fixedPlaylistStrings.get(str);
            break;
        }
    }

    // Highlighting
    let strLength = fixedStr.length;
    let startPos = curPlaylist.value.indexOf(fixedStr);
    let endPos = (fixedStr.at(-1) == '\n') ? startPos + strLength - 1 : startPos + strLength;
    
    curPlaylist.select();
    curPlaylist.setSelectionRange(startPos, endPos, 'forward');
    curPlaylist.blur();

    // Scrolling to center textarea
    let curPlaylistStyle = getComputedStyle(curPlaylist);
    let borders = parseInt(curPlaylistStyle.borderLeft) + parseInt(curPlaylistStyle.borderRight);
    let scrollbar = (curPlaylist.offsetWidth - curPlaylist.clientWidth - borders) ? true : false;
    if (!scrollbar) return;

    let rowHeight = parseFloat(curPlaylistStyle.lineHeight);
    let visibleRows = curPlaylist.clientHeight / rowHeight;
    let selectedRows = curPlaylist.value.slice(startPos, endPos).split(/\n/).length;
    let strings = curPlaylist.value.slice(0, startPos).split(/\n/);
    let rows = strings.length - 1;
    let cols = curPlaylist.cols;

    for (let str of strings) {
        if (!str.length) continue;

        let subRows = Math.ceil(str.length / cols) - 1;
        if (subRows) rows += subRows;
    }

    curPlaylist.scrollTop = (rows - Math.ceil((visibleRows - selectedRows) / 2)) * rowHeight;
}

defaultSetBtn.onclick = () => {
    changeConfig(null);
    changePlayerColor(null);
    changePlaylistStyle(null);
    changeVolume(null);
    changeNumberOfVisibleTracks(null);
    changeScrollElementsOpacity(null);
    changeWheelScrollStep(null);
};

////////////////
// Modal area //
////////////////

function keyInfoAction() {
    if (modalArea.classList.contains('active')) {
        hideModalArea();
    } else {
        showModalArea();
    }
}

function showModalArea() {
    clearTimeout(timerModalArea);
    modalArea.hidden = false;

    setTimeout(() => modalArea.classList.add('active'));
}

function hideModalArea() {
    clearTimeout(timerModalArea);
    modalArea.classList.remove('active');

    let transTime = parseFloat(getComputedStyle(modalArea).transitionDuration) * 1000;
    timerModalArea = setTimeout(() => {
        modalArea.hidden = true;

        if (settingsArea.classList.contains('active') && selectedAudio) {
            highlightSelected(selectedAudio);
        }
    }, transTime);
}

/////////////////////
// Global handlers //
/////////////////////

// Document load
window.addEventListener('load', () => {
    hidePreload();
    showLastPlayedTrackInfo();
});

function hidePreload() {
    player.classList.remove('loading');
}

// Highlighting selected track in current playlist
document.addEventListener('click', (event) => {
    if (!settingsArea.classList.contains('active')) return;
    if (event.target.closest('#settings-area')) return;
    if (event.target.closest('.key-info')) return;
    if (!selectedAudio) return;

    highlightSelected(selectedAudio);
});

// Closing info by clicking
document.addEventListener('click', (event) => {
    if (modalArea.hidden) return;
    if (event.target == infoBtn) return;
    if (event.target.closest('.key-info') && !event.target.closest('#close-info')) return;

    hideModalArea();
});

// Filtering input element keys
for (let input of document.querySelectorAll('input')) {
    input.onkeydown = (event) => (event.key >= '0' && event.key <= '9') ||
        event.key == 'ArrowUp' || event.key == 'ArrowDown' ||
        event.key == 'ArrowLeft' || event.key == 'ArrowRight' ||
        event.key == 'Delete' || event.key == 'Backspace' ||
        event.key == 'Enter' || event.key == 'Tab' ||
        (event.ctrlKey && (event.code == 'KeyX' || event.code == 'KeyC' || event.code == 'KeyV'));
}

// Out of focus
document.body.onblur = outOfFocusActions;
curPlaylist.onfocus = endScrolling;

for (let input of document.querySelectorAll('input')) {
    input.onfocus = outOfFocusActions;
}

function outOfFocusActions() {
    endScrolling();
    endSteppingAccelerating();
    endPressedFx();
}

// Button hover tooltip
let tButtons = player.querySelectorAll('[data-tooltip]');

for (let elem of tButtons) {
    let hoverIntent = new PlayerButtonsHoverIntent({
        elem: elem,

        repeatTask: (elem == timeRange || elem == volumeRange) ? true : false,

        executeTask() {
            if (!this.elemRect) return;

            if (this.elem == timeRange) {
                let calculatedTime = calcTimeRangeTooltip(this.x1);
                if (!calculatedTime) return;
                this.elem.dataset.tooltip = calculatedTime;
            }

            if (this.elem == volumeRange) {
                this.elem.dataset.tooltip = calcVolumeTooltip();
            }

            tooltip.innerHTML = this.elem.dataset.tooltip;

            let x;
            if (this.elem == timeRange) {
                x = this.elemRect.left + this.x1 - tooltip.offsetWidth / 2;
            } else if (this.elem == volumeRange) {
                x = volumeBar.getBoundingClientRect().left + volumeBar.offsetWidth / 2 - tooltip.offsetWidth / 2;
            } else {
                x = this.elemRect.left + this.elem.offsetWidth / 2 - tooltip.offsetWidth / 2;
            }

            if (x < 0) x = 0;
            if (x > document.documentElement.clientWidth - tooltip.offsetWidth) {
                x = document.documentElement.clientWidth - tooltip.offsetWidth;
            }

            let y = this.elemRect.top - tooltip.offsetHeight;
            if (this.elem == timeRange) y -= 6;
            if (this.elem == volumeRange) y -= 10;

            if (y < 0) y = this.elemRect.top + this.y1 + 24;

            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            
            tooltip.style.opacity = 1;
            tooltip.style.marginTop = 0;
        },

        dismissTask() {
            tooltip.style.opacity = '';
            tooltip.style.marginTop = '';

            if (this.elem == timeRange || this.elem == volumeRange) {
                this.elem.dataset.tooltip = '';
            }
        }
    });

    if (elem == timeRange) timeRangeHoverIntent = hoverIntent;
    if (elem == volumeRange) volumeRangeHoverIntent = hoverIntent;
}

// Button pressed FX
function runActionOnKey_highlightButton(key, btn, actionFunc, arg) {
    highlightedBtns.add(btn);
    btn.classList.add('key-pressed');

    document.addEventListener('keyup', function removeKeyPressedFx(event) {
        if (event.code != key) return;
        document.removeEventListener('keyup', removeKeyPressedFx);
        if (!highlightedBtns.has(btn)) return;

        highlightedBtns.delete(btn);
        btn.classList.remove('key-pressed');

        actionFunc(arg);
    });
}

function endPressedFx() {
    for (let btn of highlightedBtns) {
        highlightedBtns.delete(btn);
        btn.classList.remove('key-pressed');
    }
}

//////////////////
// Key handlers //
//////////////////

// Playing/pausing/stoping audio
document.addEventListener('keydown', (event) =>  {
    if (
        ((event.code == 'KeyW' && !event.shiftKey) ||
        event.code == 'Space') &&
        !event.repeat
    ) {
        event.preventDefault();
        runActionOnKey_highlightButton(event.code, playPauseBtn, playPauseAction);
    }
    if (event.code == 'KeyS' && !event.shiftKey && !event.repeat) {
        runActionOnKey_highlightButton(event.code, stopBtn, stopAction);
    }
});

// Stepping/accelerating audio
document.addEventListener('keydown', (event) => {
    if (
        (event.code == 'ArrowLeft' || event.code == 'ArrowRight' ||
        event.code == 'KeyA' || event.code == 'KeyD') &&
        !event.repeat
    ) {
        downKeyStepAccAction(event.code);

        let keyAccType = stepKeysData[event.code].accelerationType;
        if (acceleration && keyAccType == accelerationType) return;

        let btn = stepKeysData[event.code].button;
        highlightedBtns.add(btn);
        btn.classList.add('key-pressed');
    }
});
document.addEventListener('keyup', (event) => {
    if (
        event.code == 'ArrowLeft' || event.code == 'ArrowRight' ||
        event.code == 'KeyA' || event.code == 'KeyD'
    ) {
        upKeyStepAccAction(event.code);

        let btn = stepKeysData[event.code].button;
        highlightedBtns.delete(btn);
        btn.classList.remove('key-pressed');
    }
});

// Randomizing/repeating track/playlist
document.addEventListener('keydown', (event) => {
    if (event.code == 'KeyQ' && !event.repeat) {
        runActionOnKey_highlightButton(event.code, shuffleBtn.closest('.btn-img-wrapper'), shuffleAction);
    }
    if (event.code == 'KeyE' && !event.repeat) {
        runActionOnKey_highlightButton(event.code, repeatBtn.closest('.btn-img-wrapper'), repeatAction);
    }
});

// Changing volume
document.addEventListener('keydown', (event) => {
    if (
        (event.code == 'KeyM' || (event.code == 'KeyR' && !event.shiftKey)) &&
        !event.repeat
    ) {
        runActionOnKey_highlightButton(event.code, volumeBtn, volumeAction);
    }
    if ((event.shiftKey && event.code == 'KeyR') || event.code == 'Period') {
        let keyRepeat = event.repeat ? true : false;
        changeVolumeAction('increase', keyRepeat);
    }
    if ((event.shiftKey && event.code == 'KeyF') || event.code == 'Comma') {
        let keyRepeat = event.repeat ? true : false;
        changeVolumeAction('reduce', keyRepeat);
    }
});

// Changing buttons configuration, player coloring, playlist style
document.addEventListener('keydown', (event) => {
    if (event.code == 'KeyZ' && !event.repeat && !event.ctrlKey) {
        let idx = configsBank.indexOf(config);
        runActionOnKey_highlightButton(event.code, configBtn, changeConfig, idx + 1);
    }
    if (event.code == 'KeyX' && !event.repeat && !event.ctrlKey) {
        let idx = playerColorsBank.indexOf(playerColor);
        runActionOnKey_highlightButton(event.code, colorBtn, changePlayerColor, idx + 1);
    }
    if (event.code == 'KeyC' && !event.repeat && !event.ctrlKey) {
        let idx = playlistStylesBank.indexOf(playlistStyle);
        runActionOnKey_highlightButton(event.code, playlistStyleBtn, changePlaylistStyle, idx + 1);
    }
});

// Showing/hiding settings
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && !event.shiftKey && !event.repeat) {
        runActionOnKey_highlightButton(event.code, settingsBtn, settingsAction);
    }
});

// Showing/hiding info
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyT' && !event.repeat) {
        runActionOnKey_highlightButton(event.code, infoBtn, keyInfoAction);
    }
});

// Scrolling playlist
document.addEventListener('keydown', (event) =>  {
    if (
        (event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
        event.code == 'PageUp' || event.code == 'PageDown' ||
        event.code == 'Home' || event.code == 'End') &&
        !event.repeat
    ) {
        //if (document.activeElement == playlist) event.preventDefault();
        downKeyScrollAction(event.code);
    }
    if (
        (event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
        event.code == 'PageUp' || event.code == 'PageDown') &&
        event.repeat
    ) {
        repeatKeyScrollAction();
    }
});
document.addEventListener('keyup', (event) =>  {
    if (
        event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
        event.code == 'PageUp' || event.code == 'PageDown' ||
        event.code == 'Home' || event.code == 'End'
    ) {
        upKeyScrollAction(event.code);
    }
});
