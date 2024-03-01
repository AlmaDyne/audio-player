import { tracklistsData } from './tracklists.js';
import { configClassic } from './controls-config-classic.js';
import { configStylish } from './controls-config-stylish.js';
import { PlayerHoverIntent } from './player-hover-intent.js';

console.log(localStorage);
//localStorage.clear();

const cssRoot = document.querySelector(':root');
const playerContainer = document.getElementById('player-container');
const tracklistSelection = document.getElementById('tracklist-selection');
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
const playlistContainer = document.getElementById('playlist-container');
const playlistLim = document.getElementById('playlist-limiter');
const visPlaylistArea = document.getElementById('visible-playlist-area');
const playlist = document.getElementById('playlist');
const playlistScrollArrowUp = playlistContainer.querySelector('.scroll-arrows-box.up > .playlist-scroll-arrow');
const playlistScrollArrowDown = playlistContainer.querySelector('.scroll-arrows-box.down > .playlist-scroll-arrow');
const outerScrollArrowsUp = playlistContainer.querySelectorAll('.scroll-arrows-box.up > .outer-scroll-arrow');
const outerScrollArrowsDown = playlistContainer.querySelectorAll('.scroll-arrows-box.down > .outer-scroll-arrow');
const tempTrackBox = document.getElementById('temporary-track-box');
const configBtn = document.getElementById('configuration');
const colorBtn = document.getElementById('coloring');
const playlistStyleBtn = document.getElementById('playlist-style');
const settingsBtn = document.getElementById('settings');
const keyInfoBtn = document.getElementById('info');
const settingsArea = document.getElementById('settings-area');
const curPlaylist = document.getElementById('current-playlist');
const defaultSetBtn = document.getElementById('default-settings');
const closeSetBtn = document.getElementById('close-settings');
const keysInfoArea = document.getElementById('keys-info-area');
const TIMELINE_MARGIN = Math.abs(parseInt(getComputedStyle(timeline).marginLeft));  
const trackHeight = parseInt(getComputedStyle(playlistLim).getPropertyValue('--track-height'));
const SCROLL_ARROW_BOX_HEIGHT = playlistContainer.querySelector('.scroll-arrows-box').offsetHeight;
const TIMELINE_POSITION_CHANGE_STEP = 0.5;
const TIMELINE_UPDATE_INTERVAL = 200;
const LAG = 16.7;
const ACCELERATION_FACTOR = 5;
const ACCELERATION_DELAY = 750;
const PLAYLIST_FINISH_DELAY = 500;
const DEFAULT_SCROLL_DURATION = 150;
const KEY_SCROLL_DURATION = 120;
const HIGHLIGHT_SELECTED_FOCUS_DELAY = 500;
let originOrderedAudios = [];
let curOrderedAudios = [];
let orderedDownloads = [];
let fixedCurPlaylistStrings = new Map();
let highlightedBtns = new Map();
let activeScrollKeys = new Set();
let activeStepAccKeys = new Set();
let canceledStepAccKeys = new Set();
let accelerateScrolling = false;
let pointerModeScrolling = false;
let activeScrollingOnKeyRepeat = false;
let activeScrollingInPointerMode = false;
let cursorOverPlaylist = false;
let scrollElemsDisplaying = false;
let playOn = false;
let roundTime = false;
let timePosSeeking = false;
let timeRangeEnter = false;
let timelinePos = 0;
let timerTimelineUpd = null;
let timerAccelerateAudioDelay = null;
let timerFinishPlay = null;
let timerHideScrollElems = null;
let timerFocusDelay = null;
let timerAccelerateScrolling = null;
let timerWindowScrollDelay = null;
let titleMoveTimers = {};
let requestCheckCurTime = null;
let requestScrollAligned = null;
let requestScrollInPointerMode = null;
let requestScrollOnKeyRepeat = null;
let highlightActiveElem = null;
let playlistLimScrollDirection = null;
let playlistLimScrollTop = 0;
let curAccelerateKey = null;
let acceleratePlaying = true;
let acceleration = false;
let accelerationType = 'none';
let timeRangeHoverIntent = {};
let volumeRangeHoverIntent = {};
let endWindowScrolling = new CustomEvent('endWinScroll');

defineProperty('selectedAudio', undefined);

function defineProperty(propertyName, audio) {
    Object.defineProperty(window, propertyName, {
        get() {
            return audio;
        },
        set(newAudio) {
            if (propertyName != 'selectedAudio') return;

            if (audio && audio.hasAttribute('data-relocated') && audio != newAudio) {
                audio.parentElement.remove();
            }

            audio = newAudio;
        }
    });
}

const DEFAULTS_DATA = {
    'first-tracklist': tracklistsData[Object.keys(tracklistsData)[0]],
    'visible-tracks__classic-config': 7,
    'visible-tracks__stylish-config': 5,
    'player_volume': 0.75,
    'scroll-elements-opacity': 70,
    'wheel-scroll-step': 2
};

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
        stepFunction: rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    KeyD: {
        stepFunction: forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    },
    ArrowLeft: {
        stepFunction: rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    ArrowRight: {
        stepFunction: forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    },
    PointerRewind: {
        stepFunction: rewindAction,
        accelerationType: 'fast-rewind',
        button: rewindBtn
    },
    PointerForward: {
        stepFunction: forwardAction,
        accelerationType: 'fast-forward',
        button: forwardBtn
    }
};

const scrollingKeysData = {
    'ArrowUp': {
        direction: 'up',
        factor: 1,
        deltaHeight: function() { return trackHeight * this.factor }
    },
    'ArrowDown': {
        direction: 'down',
        factor: 1,
        deltaHeight: function() { return trackHeight * this.factor }
    },
    'PageUp': {
        direction: 'up',
        factor: 3,
        deltaHeight: function() { return trackHeight * this.factor }
    },
    'PageDown': {
        direction: 'down',
        factor: 3,
        deltaHeight: function() { return trackHeight * this.factor }
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

/////////////////////////
// Selected track info //
/////////////////////////

function showTrackInfo(audio, prevSelected) {
    displayInfo.hidden = true;

    highlightSelected(audio);
    keepSelectedTitleVisible(audio);
    if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.executeTask();

    if (audio !== prevSelected) {
        if (prevSelected) disconnectAudioHandlers(prevSelected);
        connectAudioHandlers(audio);

        clearTitlesMovingTimers();

        trackTitleDisplay.textContent = audio.dataset.title;
        artistNameDisplay.textContent = audio.dataset.artist;
        
        trackTitleDisplay.style.left = '';
        artistNameDisplay.style.left = '';

        moveTitles(trackTitleDisplay, artistNameDisplay);
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

function connectAudioHandlers(audio) {
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
            saveLastPlayedAudioInfo(audio);
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
}

function disconnectAudioHandlers(audio) {
    if (audio.paused) audio.onplaying = () => false;
    audio.onended = () => false;
    audio.onpause = () => false;
    audio.onwaiting = () => false;
    audio.onseeking = () => false;
}

function moveTitles(...titles) {
    for (let title of titles) {
        let boxWidth = player.querySelector('.selected-track').offsetWidth;
        let titleWidth = title.offsetWidth;
        if (titleWidth <= boxWidth) return;

        title.style.left = 0;

        let timerTitleMove = setTimeout(() => {
            let diffWidth = boxWidth - titleWidth;
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

//////////////////////////////////
// Track time and position info //
//////////////////////////////////

timeRange.onclick = () => false;

timeRange.oncontextmenu = (event) => {
    if (event.pointerType == 'touch' || event.pointerType == 'pen') return false;
}

timeRange.onpointerenter = enterTimeRange;

function enterTimeRange() {
    timeRangeEnter = true;

    timeRange.onpointermove = moveOverTimeRange;

    timeRange.onpointerleave = function() {
        timeRangeEnter = false;
        timeBar.hidden = true;
        this.style.cursor = '';

        this.onpointerdown = () => false;
        this.onpointermove = () => false;
        this.onpointerleave = () => false;
    };

    if (!selectedAudio) return;

    timeBar.hidden = false;
    timeRange.style.cursor = 'pointer';

    timeRange.onpointerdown = function(event) {
        if (event.button != 0) return;

        document.getSelection().empty();

        this.setPointerCapture(event.pointerId);
        this.pointerId = event.pointerId;

        clearFinPlayTimer();
        clearUpdTimers();

        if (playOn) {
            console.log('pause (pointer down on timeline) | ' + selectedAudio.dataset.title);

            pauseAudio(selectedAudio);
        }

        timePosSeeking = true;

        moveOverTimeRange = moveOverTimeRange.bind(this);
        moveOverTimeRange(event);

        this.onpointerup = function() {
            timePosSeeking = false;

            if (playOn) {
                playAudio(selectedAudio);
            } else if (acceleration) {
                runUpdTimers(selectedAudio);
            }

            this.onpointerup = () => false;
            delete this.pointerId;
        };
    };

    function moveOverTimeRange(event) {
        let x = findXPos(event.clientX);
        let timeBarPos = (x < this.offsetWidth) ? x : x - 1;

        timeBar.style.left = timeBarPos + 'px';

        if (timePosSeeking) {
            document.getSelection().empty();
            
            timelinePos = x;
            updateTimePosition(timelinePos);
        }
    }

    function findXPos(clientX) {
        let x = clientX - timeRange.getBoundingClientRect().left;
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
        if (event.button != 0) return;

        this.setPointerCapture(event.pointerId);

        downKeyStepAccAction(key);
    };
    
    button.onpointerup = function() {
        upKeyStepAccAction(key);
    };

    button.oncontextmenu = (event) => {
        if (event.pointerType != 'mouse') return false;
    }

    button.onpointercancel = () => {
        clearTimeout(timerAccelerateAudioDelay);

        if (acceleration) stopAcceleration();

        curAccelerateKey = null;
        activeStepAccKeys.clear();
        canceledStepAccKeys.clear();
    };
}

function downKeyStepAccAction(key) {
    activeStepAccKeys.add(key);

    clearTimeout(timerAccelerateAudioDelay);

    timerAccelerateAudioDelay = setTimeout(runAcceleration, ACCELERATION_DELAY);
}

function upKeyStepAccAction(key) {
    if (!activeStepAccKeys.size) return;

    activeStepAccKeys.delete(key);

    clearTimeout(timerAccelerateAudioDelay);

    if (activeStepAccKeys.size) {
        if (acceleration) {
            if (key == curAccelerateKey) {
                runAcceleration();
            } else {
                if (!canceledStepAccKeys.has(key)) {
                    if (!timePosSeeking) stepKeysData[key].stepFunction();
                } else {
                    canceledStepAccKeys.delete(key);
                }
            }
        } else {
            if (!timePosSeeking) stepKeysData[key].stepFunction();
            timerAccelerateAudioDelay = setTimeout(runAcceleration, ACCELERATION_DELAY);
        }
    } else {
        if (acceleration) {
            stopAcceleration();
        } else {
            if (!timePosSeeking) stepKeysData[key].stepFunction();
        }

        curAccelerateKey = null;
        canceledStepAccKeys.clear();
    }
}

function runAcceleration() {
    canceledStepAccKeys.clear();
    activeStepAccKeys.forEach(activeKey => canceledStepAccKeys.add(activeKey));
    
    curAccelerateKey = Array.from(activeStepAccKeys)[activeStepAccKeys.size - 1];
    let keyAccType = stepKeysData[curAccelerateKey].accelerationType;

    if (keyAccType != accelerationType) {
        if (acceleration) stopAcceleration();
        if (selectedAudio) accelerate(selectedAudio, keyAccType);
    }
}

function rewindAction() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[curOrderedAudios.length - 1];
        if (!selectedAudio) return;

        console.log('step-rewind track selecting | ' + selectedAudio.dataset.title);
        
        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        return;
    }

    if (
        (selectedAudio.duration && selectedAudio.currentTime <= 3) ||
        (!selectedAudio.duration && !timelinePos)
    ) { 
        // Playlist is cleared, selected audio is from the previous playlist
        if (!curOrderedAudios.length) return;

        clearFinPlayTimer();
        clearUpdTimers();
    
        if (playOn) pauseAudio(selectedAudio);

        let prevSelectedAudio = selectedAudio;
        let idx = curOrderedAudios.findIndex(aud => aud === selectedAudio);
        let prevAudio = curOrderedAudios[--idx];
        
        removeSelected(selectedAudio);
        selectedAudio = prevAudio ? prevAudio : curOrderedAudios[curOrderedAudios.length - 1];
        setSelected(selectedAudio);

        console.log('step-rewind track selecting | ' + selectedAudio.dataset.title);

        prevSelectedAudio.currentTime = 0;
        selectedAudio.currentTime = 0;
        timelinePos = 0;
        
        showTrackInfo(selectedAudio, prevSelectedAudio);

        if (playOn) {
            playAudio(selectedAudio);
        } else if (acceleration) {
            runUpdTimers(selectedAudio);
        }
    } else {
        console.log('skip to start | ' + selectedAudio.dataset.title);

        clearFinPlayTimer();

        selectedAudio.currentTime = 0;
        timelinePos = 0;

        keepSelectedTitleVisible(selectedAudio);
        if (selectedAudio.duration) updateTime(selectedAudio);
        updateTimeline(selectedAudio);
    }
}

function forwardAction() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[0];
        if (!selectedAudio) return;

        console.log('step-forward track selecting | ' + selectedAudio.dataset.title);

        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        return;
    }

    // Playlist is cleared, selected audio is from the previous playlist
    if (!curOrderedAudios.length) return;

    clearFinPlayTimer();
    clearUpdTimers();

    if (playOn) pauseAudio(selectedAudio);
    
    let prevSelectedAudio = selectedAudio;
    let idx = curOrderedAudios.findIndex(aud => aud === selectedAudio);
    let nextAudio = curOrderedAudios[++idx];

    removeSelected(selectedAudio);
    selectedAudio = nextAudio ? nextAudio : curOrderedAudios[0];
    setSelected(selectedAudio);

    console.log('step-forward track selecting | ' + selectedAudio.dataset.title);

    prevSelectedAudio.currentTime = 0;
    selectedAudio.currentTime = 0;
    timelinePos = 0;

    showTrackInfo(selectedAudio, prevSelectedAudio);

    if (playOn) {
        playAudio(selectedAudio);
    } else if (acceleration) {
        runUpdTimers(selectedAudio);
    }
}

//////////////////
// Acceleration //
//////////////////

function accelerate(audio, accType) {
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

    highlightSelected(selectedAudio);
}

function stopAcceleration() {
    console.log(`stop ${accelerationType} acceleration`);

    clearTimeout(timerAccelerateAudioDelay);
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

    if (settingsArea.classList.contains('active')) {
        rememberAndReturnFocus(0);
    } else {
        highlightActiveElem = null;
    }
}

function stopAccelerationAndClear() {
    if (!activeStepAccKeys.size) return;

    clearTimeout(timerAccelerateAudioDelay);

    if (acceleration) stopAcceleration();

    curAccelerateKey = null;
    activeStepAccKeys.clear();
    canceledStepAccKeys.clear();
}

///////////////////////////////////////
// Player controls - Play/pause/stop //
///////////////////////////////////////

playPauseBtn.onclick = playPauseAction;

function playPauseAction() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[0];
        if (!selectedAudio) return;

        setSelected(selectedAudio);
        showTrackInfo(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
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
        audio.src = audio.dataset.src;

        if (acceleration) runUpdTimers(audio);

        setTimeout(() => {
            if (audio.duration) {
                if (playOn && audio === selectedAudio) runPlaying(audio);
            } else {
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
            runPlaying(audio);
        } else if (acceleration) {
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

        audio.play().catch(error => {
            if (error.name != 'AbortError') {
                console.error(error);
            }
        });

        audio.oncanplaythrough = () => false;
    }
}

stopBtn.onclick = () => stopAction();

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
    playPauseBtn.classList.remove('icon-play');
    playPauseBtn.classList.add('icon-pause');
}

function setPauseState() {
    playOn = false;
    playPauseBtn.classList.remove('icon-pause');
    playPauseBtn.classList.add('icon-play');
}

//////////////////////////////////////
// Updating track time and position //
//////////////////////////////////////

function updateTime(audio, displayStr) {
    if (audio) {
        console.log(audio.currentTime + ' | ' + audio.dataset.title);

        let mins = roundTime ?
            Math.floor(Math.round(audio.currentTime) / 60) :
            Math.floor(audio.currentTime / 60);
        let secs = roundTime ?
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
    let timelineWidth = audio.duration ?
        audio.currentTime / audio.duration * 100 :
        timelinePos / timeRange.offsetWidth * 100;
    
    timeline.style.width = `calc(${TIMELINE_MARGIN}px + ${timelineWidth}%)`;
}

function runUpdTimers(audio) {
    let rateFactor = acceleration ? ACCELERATION_FACTOR : 1;
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
        timerTimelineUpd = setInterval(() => {
            switch (accelerationType) {
                case 'fast-forward':
                    timeline.style.width = `calc(${timeline.offsetWidth}px + ${TIMELINE_POSITION_CHANGE_STEP}%)`;
                    timelinePos = timeline.offsetWidth - TIMELINE_MARGIN;
                    isTrackFinished = timelinePos >= timeRange.offsetWidth;
                    break;
                case 'fast-rewind':
                    timeline.style.width = `calc(${timeline.offsetWidth}px - ${TIMELINE_POSITION_CHANGE_STEP}%)`;
                    timelinePos = timeline.offsetWidth - TIMELINE_MARGIN;
                    isTrackFinished = timelinePos <= 0;
                    break;
            }

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

    // Round the current time to the audio duration and extend the timeline over the entire range
    roundTime = true;
    updateTime(audio);
    updateTimeline(audio);
    roundTime = false;

    if (repeatBtn.dataset.repeat === 'track') {
        playFollowingAudio(audio);
    } else {
        let idx = curOrderedAudios.findIndex(aud => aud === audio);
        let followingAudio = (acceleration && accelerationType === 'fast-rewind') ?
            curOrderedAudios[--idx] :
            curOrderedAudios[++idx];

        if (followingAudio) {
            playFollowingAudio(followingAudio);
        } else {
            if (acceleration && accelerationType === 'fast-rewind') {
                followingAudio = curOrderedAudios[curOrderedAudios.length - 1];

                if (followingAudio) playFollowingAudio(followingAudio);
            } else {
                let shuffleInfo = shuffleBtn.classList.contains('active') ? 'shuffle ' : '';

                if (repeatBtn.dataset.repeat === 'playlist') {
                    followingAudio = curOrderedAudios[0];

                    if (followingAudio) {
                        console.log(`repeat ${shuffleInfo}playlist`);

                        playFollowingAudio(followingAudio);
                    } else {
                        console.log(`${shuffleInfo}playlist ended`);

                        finishPlaying();
                    }
                } else if (repeatBtn.dataset.repeat === 'none') {
                    console.log(`${shuffleInfo}playlist ended`);

                    finishPlaying();
                }
            }
        }
    }

    function playFollowingAudio(followingAudio) {
        let prevSelectedAudio = selectedAudio;

        removeSelected(selectedAudio);
        selectedAudio = followingAudio;
        setSelected(selectedAudio);

        console.log('following track selecting | ' + selectedAudio.dataset.title);

        if (!acceleration || (acceleration && accelerationType === 'fast-forward')) {
            prevSelectedAudio.currentTime = 0;
            selectedAudio.currentTime = 0;
            timelinePos = 0;
        } else if (acceleration && accelerationType === 'fast-rewind') { 
            if (selectedAudio.duration) selectedAudio.currentTime = selectedAudio.duration;
            timelinePos = timeRange.offsetWidth;
        }

        showTrackInfo(selectedAudio, prevSelectedAudio);

        if (playOn) {
            playAudio(selectedAudio);
        } else if (acceleration) {
            runUpdTimers(selectedAudio);
        }
    }
}

function finishPlaying() {
    console.log('finish playing');
    
    setPauseState();
    clearTitlesMovingTimers();
    if (acceleration) stopAcceleration();
    
    timerFinishPlay = true; // For return focus check
    highlightSelected(selectedAudio);

    timerFinishPlay = setTimeout(() => {
        stopAccelerationAndClear();

        trackTitleDisplay.textContent = '';
        artistNameDisplay.textContent = '';

        updateTime(null, '--:--');
        updateDuration(null, '--:--');

        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.dismissTask();
        timePosSeeking = false;
        timeline.style.width = `${TIMELINE_MARGIN}px`;
        timeRange.style.cursor = '';
        timeBar.hidden = true;
        timeRange.onpointerdown = () => false;
        timeRange.onpointerup = () => false;
        if (timeRange.pointerId) {
            timeRange.releasePointerCapture(timeRange.pointerId);
            delete timeRange.pointerId;
        }

        selectedAudio.currentTime = 0;
        timelinePos = 0;
        
        removeSelected(selectedAudio);
        disconnectAudioHandlers(selectedAudio);
        selectedAudio = undefined;

        (function resetScrollPositions() {
            let winScrollDuration = LAG;
            let curPlaylistScrollTop = false;

            if (playlistLim.scrollTop) {
                scrollAndAlign({
                    direction: 'up',
                    deltaHeight: playlistLim.scrollTop,
                    align: false,
                    hide: true
                });
    
                winScrollDuration += DEFAULT_SCROLL_DURATION;
            }

            curPlaylist.select();
            curPlaylist.setSelectionRange(0, 0);
            if (curPlaylist != highlightActiveElem) curPlaylist.blur();

            if (curPlaylist.scrollTop) {
                curPlaylistScrollTop = true;
                curPlaylist.scrollTop = 0;
            }
    
            timerWindowScrollDelay = setTimeout(() => {
                window.scrollTo(0, 0);

                // Returning focus to the active element
                if (highlightActiveElem) {
                    if (!curPlaylistScrollTop) {
                        document.dispatchEvent(endWindowScrolling);
                    } else {
                        curPlaylist.addEventListener('scrollend', function scrollCurPlaylistToEnd() {
                            document.dispatchEvent(endWindowScrolling);
    
                            curPlaylist.removeEventListener('scrollend', scrollCurPlaylistToEnd);
                        });
                    }
                }
    
                timerWindowScrollDelay = null;
            }, winScrollDuration);
        })();

        timerFinishPlay = null;
    }, PLAYLIST_FINISH_DELAY);
}

//////////////////
// Clear timers //
//////////////////

function clearUpdTimers() {
    cancelAnimationFrame(requestCheckCurTime);
    clearInterval(timerTimelineUpd);
}

function clearTitlesMovingTimers() {
    for (let key in titleMoveTimers) {
        cancelAnimationFrame(titleMoveTimers[key]);
        clearInterval(titleMoveTimers[key]);
        delete titleMoveTimers[key];
    }
}

function clearFinPlayTimer() {
    if (timerFinishPlay) moveTitles(trackTitleDisplay, artistNameDisplay);

    clearTimeout(timerFinishPlay);
    timerFinishPlay = null;
}

//////////////////////
// Shuffle / Repeat //
//////////////////////

for (let btnWrapper of playerControls.querySelectorAll('.btn-img-wrapper')) {
    let button = btnWrapper.firstElementChild;

    btnWrapper.onpointerover = () => {
        button.classList.add('hover');

        btnWrapper.onpointerout = () => {
            button.classList.remove('hover');

            btnWrapper.onpointerout = () => false;
        };
    };

    btnWrapper.onclick = () => {
        switch (button.id) {
            case 'shuffle':
                shuffleAction();
                break;
            case 'repeat':
                repeatAction();
                break;
        }
    };
}

function shuffleAction() {
    shuffleBtn.classList.toggle('active');

    if (shuffleBtn.classList.contains('active')) {
        randomizePlaylist();
    } else {
        setOriginPlaylist();
    }

    if (selectedAudio) {
        highlightSelected(selectedAudio);
    } else {
        curPlaylist.scrollTop = 0;
    }
};

function setOriginPlaylist() {
    console.log('set origin playlist');

    curOrderedAudios.length = 0;

    let curPlaylistText = 'Current playlist (origin order):\n\n';

    originOrderedAudios.forEach((audio, idx, array) => {
        curOrderedAudios.push(audio);
        curPlaylistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
        if (audio.dataset.dub) curPlaylistText += ' (' + audio.dataset.dub + ')';
        if (array[idx + 1]) curPlaylistText += '\n';
    });

    breakLine(curPlaylistText);
}

function randomizePlaylist() {
    console.log('create random playlist');

    shuffle(curOrderedAudios);

    if (selectedAudio) {
        curOrderedAudios.map((aud, idx, array) => {
            if (aud === selectedAudio) {
                [array[0], array[idx]] = [array[idx], array[0]];
            }
        });
    }

    let curPlaylistText = 'Current playlist (random order):\n\n';

    curOrderedAudios.forEach((audio, idx, array) => {
        curPlaylistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
        if (audio.dataset.dub) curPlaylistText += ' (' + audio.dataset.dub + ')';
        if (array[idx + 1]) curPlaylistText += '\n';
    });

    breakLine(curPlaylistText);

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));

            [array[i], array[j]] = [array[j], array[i]];
        }
    
        return array;
    }
}

function breakLine(curPlaylistText) {
    let cols = curPlaylist.cols;
    let strings = curPlaylistText.split(/\n/);
    
    fixedCurPlaylistStrings.clear();

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

        fixedCurPlaylistStrings.set(str, fixedStr);
    }

    curPlaylist.value = '';

    for (let str of fixedCurPlaylistStrings.keys()) {
        curPlaylist.value += fixedCurPlaylistStrings.get(str);
    }
}

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

    highlightSelected(selectedAudio);
}

////////////
// Volume //
////////////

function changeVolumeAction(changeType, keyRepeat) {
    if (settedVolume && !keyRepeat) savedVolume = settedVolume;

    let step = 2;
    let xPos = settedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);

    xPos += (changeType == 'increase') ? step : ((changeType == 'reduce') ? -step : 0);

    let volumePos = moveVolumeAt(xPos);
    setVolume(volumePos);
    showVolumeIcon(settedVolume);

    if (volumeRangeHoverIntent.elemRect) volumeRangeHoverIntent.executeTask();

    if (settedVolume) {
        volumeBar.classList.add('active');
    } else {
        volumeBar.classList.remove('active');
    }
        
    highlightSelected(selectedAudio);
}

volumeBtn.onclick = volumeAction;

function volumeAction() {
    if (volumeBtn.classList.contains('active')) {
        savedVolume = settedVolume;
        settedVolume = 0;
        localStorage.setItem('player_volume', settedVolume);
        if (selectedAudio) selectedAudio.volume = settedVolume;

        volumeBar.classList.remove('active');
        volumeBtn.className = 'icon-volume-off';

        volumeline.style.width = volumeBar.offsetWidth / 2 + 'px';
        volumeBar.style.left = 0;
    } else {
        settedVolume = savedVolume;
        localStorage.setItem('player_volume', settedVolume);
        if (selectedAudio) selectedAudio.volume = settedVolume;

        volumeBar.classList.add('active');
        showVolumeIcon(settedVolume);

        let volumePos = settedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);
        volumeline.style.width = volumePos + volumeBar.offsetWidth / 2 + 'px';
        volumeBar.style.left = volumePos + 'px';
    }

    highlightSelected(selectedAudio);
}

volumeRange.onclick = () => false;

volumeRange.oncontextmenu = (event) => {
    if (event.pointerType == 'touch' || event.pointerType == 'pen') return false;
}

volumeRange.onpointerdown = function(event) {
    if (event.pointerType == 'mouse' && !event.target.closest('#volume-range')) return;

    if (settedVolume) savedVolume = settedVolume;

    changeVolume(event.clientX);

    volumeBar.setPointerCapture(event.pointerId);

    volumeBar.onpointermove = (event) => changeVolume(event.clientX);

    volumeBar.onpointerup = () => {
        if (!settedVolume) volumeBar.classList.remove('active');

        volumeBar.onpointermove = () => false;
        volumeBar.onpointerup = () => false;
    };

    function changeVolume(clientX) {
        volumeBar.classList.add('active');

        let xPos = clientX - volumeRange.getBoundingClientRect().left - volumeBar.offsetWidth / 2;
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

visPlaylistArea.onpointerover = (event) => {
    if (!event.target.matches('.track-title')) return;

    let trackTitle = event.target;
    
    adjustPlaylistLimiterWidth(trackTitle, false);
    trackTitle.parentElement.classList.add('hover');
    
    trackTitle.onpointerleave = () => {
        trackTitle.parentElement.classList.remove('hover');
        playlistLim.style.width = '';

        trackTitle.onpointerleave = () => false;
    };
};

function adjustPlaylistLimiterWidth(trackTitle, isTransitionChange) {
    let docWidth = Math.max(
        document.body.scrollWidth, document.documentElement.scrollWidth,
        document.body.offsetWidth, document.documentElement.offsetWidth,
        document.body.clientWidth, document.documentElement.clientWidth
    );
    let playlistLimLeft = playlistLim.getBoundingClientRect().left + window.scrollX;
    let shift = isTouchDevice ? 1 : 0; // Bug on some mobile devices

    if (isTransitionChange) {
        let screenLim = trackTitle.parentElement;

        playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';

        screenLim.ontransitionend = () => {
            extendWidth();

            screenLim.ontransitionend = () => false;
        };
    } else {
        extendWidth();
    }

    function extendWidth() {
        let titleWidth = trackTitle.offsetWidth;
        let titleLeft = trackTitle.getBoundingClientRect().left + window.scrollX;
    
        if (titleLeft - playlistLimLeft + titleWidth > playlist.offsetWidth) {
            playlistLim.style.width = titleLeft - playlistLimLeft + titleWidth + 'px';
        }
        if (titleLeft + titleWidth > docWidth) {
            playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';
        }
    }
}

// Prohibiting text selection on the touchscreen
visPlaylistArea.addEventListener('pointerdown', (event) => {
    if (
        (event.pointerType == 'touch' || event.pointerType == 'pen') &&
        event.isPrimary &&
        event.target.matches('.track-title')
    ) {
        let trackTitle = event.target;
        trackTitle.style.userSelect = 'none';

        document.onpointerup = () => {
            trackTitle.style.userSelect = '';

            document.onpointerup = () => false;
        };
    }
});

visPlaylistArea.onclick = (event) => {
    let target;

    if (target = event.target.closest('.track-title')) {
        if (document.getSelection().toString().length) return;

        let newAudio = target.closest('.track').querySelector('audio');

        console.log('playlist track selecting | ' + newAudio.dataset.title);
    
        setPlayState();
        
        if (!selectedAudio) {
            selectedAudio = newAudio;
    
            setSelected(selectedAudio);
            showTrackInfo(selectedAudio);
            playAudio(selectedAudio);
            return;
        }
    
        clearFinPlayTimer();
    
        if (newAudio != selectedAudio) {
            clearUpdTimers();
        
            if (playOn) pauseAudio(selectedAudio);
        
            let prevSelectedAudio = selectedAudio;
    
            removeSelected(selectedAudio);
            selectedAudio = newAudio;
            setSelected(selectedAudio);
    
            prevSelectedAudio.currentTime = 0;
            selectedAudio.currentTime = 0;
            timelinePos = 0;
        
            showTrackInfo(selectedAudio, prevSelectedAudio);
        } else {
            selectedAudio.currentTime = 0;
            timelinePos = 0;
    
            keepSelectedTitleVisible(selectedAudio);
            updateTime(selectedAudio);
            updateTimeline(selectedAudio);
        }
    
        playAudio(selectedAudio);
    }

    if (target = event.target.closest('.button-delete')) {
        let track = target.closest('.track');
        let audio = track.querySelector('audio');

        console.log('delete track from playlist | ' + audio.dataset.title);

        // Cutting audio from arrays
        let originAudioIdx = originOrderedAudios.indexOf(audio);
        originOrderedAudios.splice(originAudioIdx, 1);
        curTracklist.splice(originAudioIdx, 1);

        let curAudioIdx = curOrderedAudios.indexOf(audio);
        curOrderedAudios.splice(curAudioIdx, 1);

        // Removing track element from playlist
        if (audio == selectedAudio) {
            audio.setAttribute('data-relocated', '');
            tempTrackBox.append(track);
        } else {
            track.remove();
        }

        // Recounting duplicates
        let artist = audio.dataset.artist;
        let title = audio.dataset.title;

        for (let i = originAudioIdx; i < curTracklist.length; i++) {
            let comparedArtist = curTracklist[i].artist;
            let comparedTitle = curTracklist[i].title;

            if (comparedArtist == artist && comparedTitle == title) {
                let dub = --curTracklist[i].dub;

                if (dub > 1) {
                    curTracklist[i].dub = dub;
                    originOrderedAudios[i].dataset.dub = dub; // curOrderedAudios will be updated
                } else {
                    dub = null;
                    delete curTracklist[i].dub;
                    delete originOrderedAudios[i].dataset.dub; // curOrderedAudios will be updated
                }

                let playlistTrackTitle = playlist.children[i].querySelector('.track-title');
                playlistTrackTitle.textContent = artist + ' \u2013 ' + title;
                if (dub) playlistTrackTitle.textContent += ' (' + dub + ')';
            }
        }

        localStorage.setItem('current_tracklist', JSON.stringify(curTracklist));

        // Cutting string from curPlaylist textarea
        let textMark = '\n\n';
        let textMarkEndIdx = curPlaylist.value.indexOf(textMark) + textMark.length;
        let curPlaylistText = curPlaylist.value.slice(0, textMarkEndIdx);

        curOrderedAudios.forEach((audio, idx, array) => {
            curPlaylistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
            if (audio.dataset.dub) curPlaylistText += ' (' + audio.dataset.dub + ')';
            if (array[idx + 1]) curPlaylistText += '\n';
        });

        breakLine(curPlaylistText);

        // Additional functions
        checkPlaylistScrollability();
        checkVisibilityScrollElems();
        highlightSelected(selectedAudio);
    }
};

visPlaylistArea.oncontextmenu = function(event) {
    if (!event.target.matches('.track-title')) return;

    event.preventDefault();

    document.getSelection().empty();

    let trackMenu = document.createElement('div');
    trackMenu.className = 'track-menu';
    player.appendChild(trackMenu);
    
    let downloadLink = document.createElement('div');
    downloadLink.className = 'menu-item';
    downloadLink.innerHTML = 'Save audio as MP3';
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

    downloadLink.addEventListener('click', clickDownloadLink, {once: true});
    document.addEventListener('pointerdown', removeTrackMenu);

    function clickDownloadLink() {
        let loadInfoElem = audio.parentElement.querySelector('.load-info');
        if (loadInfoElem) loadInfoElem.remove();

        downloadAudio(audio);

        trackMenu.remove();
        document.removeEventListener('pointerdown', removeTrackMenu);
    }
    
    function removeTrackMenu(event) {
        if (event.target.closest('.track-menu')) return;

        trackMenu.remove();
        downloadLink.removeEventListener('click', clickDownloadLink, {once: true});
        document.removeEventListener('pointerdown', removeTrackMenu);
    }

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

        let url = audio.dataset.src;
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

playlistLim.onscroll = () => {
    playlistLimScrollDirection = (playlistLim.scrollTop > playlistLimScrollTop) ? 'down' : 'up';
    playlistLimScrollTop = playlistLim.scrollTop;
};

playlistContainer.onpointerenter = () => {
    cursorOverPlaylist = true;

    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;

    clearTimeout(timerHideScrollElems);

    if (playlistLim.scrollTop) {
        playlistScrollArrowUp.classList.remove('inactive');
    } else {
        playlistScrollArrowUp.classList.add('inactive');
    }

    if (playlistLim.scrollHeight - playlistLim.scrollTop > playlistLim.clientHeight) {
        playlistScrollArrowDown.classList.remove('inactive');
    } else {
        playlistScrollArrowDown.classList.add('inactive');
    }

    showScrollElems();

    let activeElem = document.activeElement;
    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let isDocScrollbar = checkDocHeight();

    if (!accelerateScrolling) return;
    if (!isDocScrollbar) return;
    if (activeElem == visPlaylistArea) return;
    if (activeElem != visPlaylistArea && (activeElem.scrollHeight > activeElem.clientHeight)) return;
    if (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) return;
    if (pointerModeScrolling) return;

    startScrolling(key);
};

playlistContainer.onpointerleave = () => {
    cursorOverPlaylist = false;

    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;

    let activeElem = document.activeElement;
    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let isDocScrollbar = checkDocHeight();

    if (
        (!accelerateScrolling && !pointerModeScrolling) ||
        (accelerateScrolling && !pointerModeScrolling && (
            (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) ||
            activeElem.scrollHeight > activeElem.clientHeight
        ))
    ) {
        clearTimeout(timerHideScrollElems);
        hideScrollElems();
    }

    if (
        accelerateScrolling &&
        isDocScrollbar &&
        activeElem != visPlaylistArea  &&
        !(activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) &&
        activeElem.scrollHeight <= activeElem.clientHeight &&
        !pointerModeScrolling
    ) {
        stopScrolling();
    }
};

// Useful if document.activeElement = document.body
visPlaylistArea.addEventListener('blur', () => {
    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;
    if (!accelerateScrolling) return;
    if (cursorOverPlaylist) return;
    if (pointerModeScrolling) return;

    setTimeout(() => {
        let activeElem = document.activeElement;
        let isDocScrollbar = checkDocHeight();

        if (!isDocScrollbar) return;
        if (activeElem != document.body) return;
        if (visPlaylistArea.classList.contains('focused')) return;
        
        stopScrolling();
    });
});

visPlaylistArea.onwheel = (event) => {
    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;
    event.preventDefault();
    
    scrollAndAlign({
        direction: (event.deltaY > 0) ? 'down' : 'up',
        deltaHeight: trackHeight * wheelScrollStep,
        wheel: true
    });
};

// Enable playlist focus
visPlaylistArea.addEventListener('pointerdown', function (event) {
    if (!event.target.matches('.track-title') || event.button == 1) {
        this.focus({preventScroll: true});
    } else if (document.activeElement != visPlaylistArea) {
        this.removeAttribute('tabindex');

        document.addEventListener('pointerup', () => this.setAttribute('tabindex', 0), {once: true});
    }
});

// Pointer Mode Scrolling
visPlaylistArea.onpointerdown = function(event) {
    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;
    if (event.pointerType == 'mouse' && event.button != 1) return;
    if ((event.pointerType == 'touch' || event.pointerType == 'pen') && !event.isPrimary) return;
    event.preventDefault();
    if (pointerModeScrolling) return;

    document.getSelection().empty();

    this.setPointerCapture(event.pointerId);

    if (event.pointerType == 'mouse') {
        let cursorScrollStyles = '<link rel="stylesheet" href="styles/scrolling-cursors.css" type="text/css">';
        document.querySelector('head').insertAdjacentHTML('beforeend', cursorScrollStyles);
        document.body.classList.add('pointer-scroll-mode');

        this.onpointerup = runPointerModeScrolling;
    } else if (event.pointerType == 'touch' || event.pointerType == 'pen') {
        this.onpointermove = runPointerModeScrolling;
    }

    function runPointerModeScrolling(event) {
        console.log('pointer mode scrolling on');
    
        pointerModeScrolling = true;
    
        let centerY = event.clientY;
        let currentY = centerY;
        let lastCurrentY = currentY;
        let sensingDistance = 30;
        let direction, deltaHeight;
    
        if (event.pointerType == 'touch' || event.pointerType == 'pen') {
            this.onpointermove = () => false; // For event.pointerType == 'touch' || 'pen'
        }

        pointerMoveInPointerModeScrolling = pointerMoveInPointerModeScrolling.bind(this);
        document.addEventListener('pointermove', pointerMoveInPointerModeScrolling);
        
        function pointerMoveInPointerModeScrolling(event) {
            cancelAnimationFrame(requestScrollInPointerMode);
    
            // if pointermove was caused by the dispatchEvent method => event.clientY == null
            currentY = event.clientY || lastCurrentY;
    
            if (currentY <= centerY - sensingDistance) {
                direction = 'up';

                if (event.pointerType == 'mouse') {
                    document.body.classList.remove('scroll-down');
                    document.body.classList.add('scroll-up');
                }
            } else if (currentY >= centerY + sensingDistance) {
                direction = 'down';

                if (event.pointerType == 'mouse') {
                    document.body.classList.remove('scroll-up');
                    document.body.classList.add('scroll-down');
                }
            } else {
                direction = null;

                if (event.pointerType == 'mouse') {
                    document.body.classList.remove('scroll-up');
                    document.body.classList.remove('scroll-down');
                }
            }
    
            if ( // Scrolling in progress
                (direction == 'up' && playlistLim.scrollTop > 0) ||
                (direction == 'down' && playlistLim.scrollHeight - playlistLim.scrollTop > playlistLim.clientHeight)
            ) {
                requestScrollInPointerMode = requestAnimationFrame(function scrollInPointerMode() {
                    if (!activeScrollingInPointerMode) {
                        cancelAnimationFrame(requestScrollAligned);
                        activeScrollingInPointerMode = true;
                    }
            
                    activateScrollArrows();
            
                    let range = 200;
                    let maxDeltaHeight = playlistLim.scrollHeight / 30;
                    if (maxDeltaHeight < 40) maxDeltaHeight = 40;
                    let maxSpeed = 1;
                    let minSpeed = maxSpeed / maxDeltaHeight;
                    let y = Math.abs(centerY - currentY) - sensingDistance;
                    let speed = minSpeed + (maxSpeed - minSpeed) * (y / range) ** 3;
                    if (speed > maxSpeed) speed = maxSpeed;
                    deltaHeight = maxDeltaHeight * speed;
            
                    playlistLim.scrollTop += (direction == 'down') ? deltaHeight :
                        (direction == 'up') ? -deltaHeight : 0;
            
                    let isReachingLimits = checkReachingPlaylistLimits(direction);
    
                    if (isReachingLimits) {
                        activeScrollingInPointerMode = false;
                    } else {
                        requestScrollInPointerMode = requestAnimationFrame(scrollInPointerMode);
                    }
                });
            } else { // No scrolling action
                if (
                    !activeScrollingOnKeyRepeat &&
                    !direction &&
                    activeScrollingInPointerMode &&
                    (Math.abs(lastCurrentY - centerY) >= sensingDistance)
                ) {
                    scrollAndAlign({
                        duration: 400 / deltaHeight
                    });
                    
                    activeScrollingInPointerMode = false;
                }
            }
    
            lastCurrentY = currentY;
        }
    
        // Cancellation pointerModeScrolling
        cancelPointerModeScrolling = cancelPointerModeScrolling.bind(this);

        if (event.pointerType == 'mouse') {
            setTimeout(() => document.addEventListener('pointerdown', cancelPointerModeScrolling, {once: true}));
        } else if (event.pointerType == 'touch' || event.pointerType == 'pen') {
            this.onpointerup = cancelPointerModeScrolling;
        }
        
        function cancelPointerModeScrolling(event) {
            event.preventDefault();
    
            console.log('pointer mode scrolling off');
    
            // Before pointerModeScrolling == false to prevent additional alignment
            if (!event.target.closest('#visible-playlist-area')) {
                visPlaylistArea.blur();
            }
    
            pointerModeScrolling = false;
    
            cancelAnimationFrame(requestScrollInPointerMode);
    
            if (!accelerateScrolling) {
                alignPlaylist();
            } else {
                let isDocScrollbar = checkDocHeight();
    
                if (isDocScrollbar && !cursorOverPlaylist) {
                    alignPlaylist();
                }
            }
    
            if (event.pointerType == 'mouse') {
                document.querySelector('head > link[href="styles/scrolling-cursors.css"]').remove();
                document.body.classList.remove('pointer-scroll-mode');
                document.body.classList.remove('scroll-up');
                document.body.classList.remove('scroll-down');
            }
        
            document.removeEventListener('pointermove', pointerMoveInPointerModeScrolling);
            this.onpointerup = () => false;
    
            function alignPlaylist() {
                let duration = activeScrollingInPointerMode ? (400 / deltaHeight) : 0;
    
                scrollAndAlign({
                    duration,
                    hide: true,
                    hideTime: duration
                });
            }
        }
    }
};

function keepSelectedTitleVisible(audio) {
    let winScrollDuration = LAG;

    // Playlist scroll alignment
    if (playlistLim.scrollHeight > playlistLim.clientHeight) {
        let initScrolled = playlistLim.scrollTop;
        let visibleHeight = playlistLim.clientHeight;
        let selTrackPlaylistTop = originOrderedAudios.indexOf(audio) * trackHeight;
        let direction, deltaHeight;

        if (selTrackPlaylistTop + trackHeight > initScrolled + visibleHeight) {
            direction = 'down';
            deltaHeight = trackHeight + selTrackPlaylistTop - (initScrolled + visibleHeight);
        }

        if (selTrackPlaylistTop < initScrolled) {
            direction = 'up';
            deltaHeight = initScrolled - selTrackPlaylistTop;
        }

        if (direction && deltaHeight) { // The track title IS NOT in the visible area of the playlist
            showScrollElems();
            scrollAndAlign({
                direction,
                deltaHeight,
                align: false,
                hide: true
            });
            winScrollDuration += DEFAULT_SCROLL_DURATION;
        } else {
            cancelAnimationFrame(requestScrollAligned);

            if (initScrolled % trackHeight) {
                showScrollElems();
                scrollAndAlign({
                    hide: true
                });
                winScrollDuration += DEFAULT_SCROLL_DURATION;
            }
        }
    }

    // Window scroll alignment
    let playlistLimRect = playlistLim.getBoundingClientRect();
    let winHeight = document.documentElement.clientHeight;
    let heightShift = (playlistLim.scrollHeight > playlistLim.clientHeight) ? SCROLL_ARROW_BOX_HEIGHT : 0;

    if (
        playlistLimRect.top < heightShift ||
        playlistLimRect.bottom > winHeight - heightShift
    ) {
        clearTimeout(timerWindowScrollDelay);
        timerWindowScrollDelay = null;
    
        timerWindowScrollDelay = setTimeout(() => {
            let selTrackDocumentTop = audio.parentElement.getBoundingClientRect().top;
            let selTrackDocumentBottom = audio.parentElement.getBoundingClientRect().bottom;
            let scrolledHeight = window.pageYOffset;
            let y;
    
            if (selTrackDocumentTop < heightShift) {
                y = selTrackDocumentTop - heightShift + scrolledHeight;
                y = Math.floor(y); // For removing arrow box
            } else if (selTrackDocumentBottom > winHeight - heightShift) {
                y = selTrackDocumentBottom - winHeight + heightShift + scrolledHeight;
                y = Math.ceil(y); // For removing arrow box
            }
    
            if (y) window.scrollTo(0, y);
    
            // Returning focus to the active element
            if (highlightActiveElem) document.dispatchEvent(endWindowScrolling);
    
            timerWindowScrollDelay = null;
        }, winScrollDuration);
    }
}

function downKeyScrollAction(event) {
    let key = event.code;
    if (activeScrollKeys.has(key)) return;

    activeScrollKeys.add(key);

    if (activeScrollKeys.size == 1) {
        timerAccelerateScrolling = setTimeout(() => {
            timerAccelerateScrolling = null;
            accelerateScrolling = true;

            let isPlaylistScrolling = checkPlaylistScrolling();

            if (isPlaylistScrolling) {
                event.preventDefault();
                startScrolling(key);
                if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
            };
        }, 500);
    } else if (timerAccelerateScrolling) {
        clearTimeout(timerAccelerateScrolling);
        timerAccelerateScrolling = null;
        accelerateScrolling = true;
    }

    let isPlaylistScrolling = checkPlaylistScrolling();

    if (isPlaylistScrolling) {
        event.preventDefault();
        startScrolling(key);
    } else {
        if (!activeScrollingInPointerMode) stopScrolling();
        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    }
}

function repeatKeyScrollAction(event) {
    let isPlaylistScrolling = checkPlaylistScrolling();
    if (isPlaylistScrolling) event.preventDefault();
}

function upKeyScrollAction(event) {
    if (!activeScrollKeys.size) return;

    if (timerAccelerateScrolling) {
        clearTimeout(timerAccelerateScrolling);
        timerAccelerateScrolling = null;
    }

    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));

    let key = event.code;
    activeScrollKeys.delete(key);

    let isPlaylistScrolling = checkPlaylistScrolling();

    if (isPlaylistScrolling) {
        event.preventDefault();

        if (activeScrollKeys.size) {
            let prevKey = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            startScrolling(prevKey);
        } else { // The last active scroll key has been released
            let direction = scrollingKeysData[key].direction;
            let isReachingLimits = checkReachingPlaylistLimits(direction);
    
            if (
                isReachingLimits &&
                !cursorOverPlaylist &&
                !pointerModeScrolling
            ) {
                clearTimeout(timerHideScrollElems);
                hideScrollElems();
            }
    
            if (accelerateScrolling) {
                accelerateScrolling = false;

                if (!isReachingLimits) {
                    scrollAndAlign({
                        direction,
                        duration: KEY_SCROLL_DURATION,
                        hide: true
                    });
                }
            }
        }
    } else {
        if (activeScrollKeys.size) {
            if (!activeScrollingInPointerMode) stopScrolling();
        } else {
            accelerateScrolling = false;
        }
    }
}

function checkPlaylistScrolling() {
    let activeElem = document.activeElement;
    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];

    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return false;
    if (activeElem != visPlaylistArea && (activeElem.scrollHeight > activeElem.clientHeight)) return false;
    if (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) return false;

    let isDocScrollbar = checkDocHeight();

    if (isDocScrollbar) {
        if (
            activeElem == visPlaylistArea ||
            cursorOverPlaylist ||
            pointerModeScrolling
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

function startScrolling(key) {
    clearTimeout(timerHideScrollElems);
    showScrollElems();

    if (!accelerateScrolling) {
        scrollAndAlign({
            direction: scrollingKeysData[key].direction,
            deltaHeight: scrollingKeysData[key].deltaHeight(),
            duration: KEY_SCROLL_DURATION,
            align: (key == 'Home' || key == 'End') ? false : true,
            hide: true
        });
    } else {
        requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
    }
}

function stopScrolling() {
    if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;

    scrollAndAlign({
        duration: KEY_SCROLL_DURATION,
        hide: true,
        hideTime: KEY_SCROLL_DURATION
    });
}

function stopScrollingAndClean() {
    if (!activeScrollKeys.size) return;

    stopScrolling();

    activeScrollKeys.clear();
    accelerateScrolling = false;

    if (timerAccelerateScrolling) {
        clearTimeout(timerAccelerateScrolling);
        timerAccelerateScrolling = null;
    }
}

function scrollOnKeyRepeat() {
    if (!activeScrollKeys.size) return;

    activeScrollingOnKeyRepeat = true;

    cancelAnimationFrame(requestScrollAligned);
    cancelAnimationFrame(requestScrollOnKeyRepeat);

    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let direction = scrollingKeysData[key].direction;
    let isReachingLimits = checkReachingPlaylistLimits(direction);
    if (isReachingLimits) {
        activeScrollingOnKeyRepeat = false;
        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
        return;
    }

    activateScrollArrows();

    let deltaHeight = (key == 'Home' || key == 'End') ?
        playlistLim.scrollHeight / 10 :
        scrollingKeysData[key].factor * 10;

    playlistLim.scrollTop += (direction == 'down') ? deltaHeight : ((direction == 'up') ? -deltaHeight : 0);

    isReachingLimits = checkReachingPlaylistLimits(direction);
    if (isReachingLimits) {
        activeScrollingOnKeyRepeat = false;
        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
        return;
    }

    requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
}

function scrollAndAlign(options) {
    options = Object.assign(
        {
            direction: playlistLimScrollDirection,
            deltaHeight: 0,
            duration: DEFAULT_SCROLL_DURATION,
            wheel: false,
            align: true,
            hide: false,
            hideTime: 500
        },
        options
    );

    let {direction, deltaHeight, duration, wheel, align, hide, hideTime} = options;

    if (
        hide &&
        scrollElemsDisplaying &&
        !cursorOverPlaylist &&
        !pointerModeScrolling
    ) {
        clearTimeout(timerHideScrollElems);

        timerHideScrollElems = setTimeout(() => { 
            if (cursorOverPlaylist) return;
            if (pointerModeScrolling) return;

            hideScrollElems();
        }, hideTime);
    }

    activeScrollingOnKeyRepeat = false;

    cancelAnimationFrame(requestScrollAligned);
    cancelAnimationFrame(requestScrollOnKeyRepeat);

    activateScrollArrows();

    let isReachingLimits = checkReachingPlaylistLimits(direction);
    if (isReachingLimits) return;

    let initScrolled = playlistLim.scrollTop;
    if (!deltaHeight && !(initScrolled % trackHeight)) return;
    
    let remainderRatio = (initScrolled % trackHeight) / trackHeight;

    if (remainderRatio && align) {
        let k = (wheel) ? 1 : 0;

        if (direction == 'down') {
            deltaHeight += trackHeight * (k + 1 - remainderRatio);
        }
        if (direction == 'up') {
            deltaHeight += trackHeight * (k + remainderRatio);
        }
    }

    let startTime = performance.now();
    
    requestScrollAligned = requestAnimationFrame(function scrollAligned(time) {
        let timeFraction = (time - startTime) / duration;
        if (timeFraction < 0) {
            requestScrollAligned = requestAnimationFrame(scrollAligned);
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

        let isReachingLimits = checkReachingPlaylistLimits(direction);
        if (isReachingLimits) return;
    
        if (timeFraction < 1) {
            requestScrollAligned = requestAnimationFrame(scrollAligned);
        } else {
            if (accelerateScrolling) {
                let isPlaylistScrolling = checkPlaylistScrolling();
    
                if (isPlaylistScrolling) {
                    console.log('+');

                    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
                    startScrolling(key);
                }
            }
        }
    });
}

function checkDocHeight() {
    let winHeight = document.documentElement.offsetHeight;
    let docHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );

    return (docHeight > winHeight) ? true : false;
}

function checkReachingPlaylistLimits(direction) {
    if (direction == 'up' && playlistLim.scrollTop == 0) {
        playlistScrollArrowUp.classList.add('inactive');
        return true;
    }
    if (direction == 'down' && playlistLim.scrollHeight - playlistLim.scrollTop == playlistLim.clientHeight) {
        playlistScrollArrowDown.classList.add('inactive');
        return true;
    }
    return false;
}

function activateScrollArrows() {
    playlistScrollArrowUp.classList.remove('inactive');
    playlistScrollArrowDown.classList.remove('inactive');
}

function showScrollElems() {
    scrollElemsDisplaying = true;

    playlistScrollArrowUp.hidden = false;
    playlistScrollArrowDown.hidden = false;
}

function hideScrollElems() {
    scrollElemsDisplaying = false;

    playlistScrollArrowUp.hidden = true;
    playlistScrollArrowDown.hidden = true;
}

function checkPlaylistScrollability() {
    if (playlistLim.scrollHeight > playlistLim.clientHeight) {
        playlistContainer.classList.add('scrollable-playlist');
        if (cursorOverPlaylist || pointerModeScrolling) showScrollElems();
    } else {
        playlistContainer.classList.remove('scrollable-playlist');
        hideScrollElems();
    }
}

//////////////////
// Track titles //
//////////////////

function showLoading(audio) {
    let track = audio.closest('.track');
    track.classList.add('loading');
    indicator.classList.remove('active');
}
function hideLoading(audio) {
    let track = audio.closest('.track');
    track.classList.remove('loading');
}

function setSelected(audio) {
    let track = audio.closest('.track');
    let trackTitle = track.querySelector('.track-title');

    if (playlistStyle === 'smooth' &&
        trackTitle.matches(':hover')) {
        adjustPlaylistLimiterWidth(trackTitle, true);
    }

    track.classList.add('selected');
}
function removeSelected(audio) {
    let track = audio.closest('.track');
    let trackTitle = track.querySelector('.track-title');

    if (playlistStyle === 'smooth' && trackTitle.matches(':hover')) {
        adjustPlaylistLimiterWidth(trackTitle, true);
    }

    track.classList.remove('selected');
}

///////////////////////////
// Player footer buttons //
///////////////////////////

configBtn.onclick = (event) => {
    let idx = configsBank.indexOf(config);
    changeConfig(idx + 1);
    changeConfig.eventType = event.type;
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

keyInfoBtn.onclick = showKeysInfoArea;

///////////////////
// Settings area //
///////////////////

function settingsAction(eventType) {
    if (!settingsArea.classList.contains('active')) {
        showSettings(eventType);
    } else {
        hideSettings();
    }
}

function showSettings(eventType) {
    let activeTime = (eventType == 'keydown' && settingsArea.hidden) ? LAG : 0;

    settingsArea.hidden = false;

    setTimeout(() => {
        settingsArea.classList.add('active');
        highlightSelected(selectedAudio);

        if (!selectedAudio) {
            let activeElem = document.activeElement;
            
            curPlaylist.select();
            curPlaylist.setSelectionRange(0, 0);
            if (curPlaylist != activeElem) curPlaylist.blur();
            curPlaylist.scrollTop = 0;

            activeElem.focus();
        }
    }, activeTime);
}

function hideSettings() {
    settingsArea.classList.remove('active');

    let transTime = parseFloat(getComputedStyle(settingsArea).transitionDuration) * 1000;
    promiseChange(settingsBtn, 'KeyF', transTime, () => {
        settingsArea.hidden = true;
        
        if (highlightActiveElem && !highlightActiveElem.closest('#settings-area')) {
            highlightActiveElem.focus();
        }
    });
}

closeSetBtn.onclick = hideSettings;

function highlightSelected(audio) {
    if (!audio) return;
    if (audio.hasAttribute('data-relocated')) return;
    if (!settingsArea.classList.contains('active')) return;
    if (keysInfoArea.classList.contains('active')) return;

    // Searching string
    let artist = audio.dataset.artist.replace(/\p{P}/gu, '\\$&');
    let title = audio.dataset.title.replace(/\p{P}/gu, '\\$&');
    let dub = (audio.dataset.dub) ? ` \\(${audio.dataset.dub}\\)` : '';
    let regexp = new RegExp(`^\\d+\\.\\s${artist}\\s\u2013\\s${title}${dub}$`);
    let keyStr = Array.from(fixedCurPlaylistStrings.keys()).find(str => str.match(regexp));
    let fixedStr = fixedCurPlaylistStrings.get(keyStr);

    // Highlighting
    let startPos = curPlaylist.value.indexOf(fixedStr);
    let strLength = fixedStr.length;
    let lineBreak = (fixedStr.at(-1) == '\n') ? 1 : 0;
    let endPos = startPos + strLength - lineBreak;

    rememberAndReturnFocus(HIGHLIGHT_SELECTED_FOCUS_DELAY);

    curPlaylist.select();
    curPlaylist.setSelectionRange(startPos, endPos, 'forward');
    if (curPlaylist != highlightActiveElem) curPlaylist.blur();

    // Scrolling to center textarea
    if (curPlaylist.scrollHeight <= curPlaylist.clientHeight) return;

    let curPlaylistStyle = getComputedStyle(curPlaylist);
    let rowHeight = parseFloat(curPlaylistStyle.lineHeight);
    let visibleRows = curPlaylist.clientHeight / rowHeight;
    let selectedRows = curPlaylist.value.slice(startPos, endPos).split(/\n/).length;
    let stringsTop = curPlaylist.value.slice(0, startPos).split(/\n/);
    let rowsTop = stringsTop.length - 1;

    curPlaylist.scrollTop = (rowsTop - Math.ceil((visibleRows - selectedRows) / 2)) * rowHeight;
}

// Returning focus to the last active element after highlighting the selected audio
function rememberAndReturnFocus(delayTime) {
    clearTimeout(timerFocusDelay);
    if (!highlightActiveElem) highlightActiveElem = document.activeElement;
    if (acceleration) return;

    if (!timerWindowScrollDelay && !timerFinishPlay) {
        runTimerFocusDelay();
    } else {
        document.addEventListener('endWinScroll', waitEndingWinScroll);

        function waitEndingWinScroll() {
            clearTimeout(timerFocusDelay);
            runTimerFocusDelay();

            document.removeEventListener('endWinScroll', waitEndingWinScroll);
        }
    }

    function runTimerFocusDelay() {
        timerFocusDelay = setTimeout(() => {
            let preventScroll = (highlightActiveElem == visPlaylistArea) ? true : false;

            highlightActiveElem.focus({preventScroll});
            highlightActiveElem = null;
        }, delayTime);
    }
}

function cancelReturningFocus() {
    if (timerFinishPlay) {
        highlightActiveElem = document.activeElement;
    } else {
        clearTimeout(timerFocusDelay);
        highlightActiveElem = null;
    }
}

defaultSetBtn.onclick = () => {
    changeConfig(null);
    changePlayerColor(null);
    changePlaylistStyle(null);
    changeVolume(null);
    changeNumberOfVisibleTracks(null);
    changeScrollElemsOpacity(null);
    changeWheelScrollStep(null);
    showHideAddOptions(null);
};

////////////////
// Modal area //
////////////////

function keyInfoAction(eventType) {
    if (!keysInfoArea.classList.contains('active')) {
        showKeysInfoArea(eventType);
    } else {
        hideKeysInfoArea();
    }
}

function showKeysInfoArea(eventType) {
    let activeTime = (eventType == 'keydown' && keysInfoArea.hidden) ? LAG : 0;

    keysInfoArea.hidden = false;

    setTimeout(() => keysInfoArea.classList.add('active'), activeTime);
}

function hideKeysInfoArea() {
    keysInfoArea.classList.remove('active');
    highlightSelected(selectedAudio);

    let transTime = parseFloat(getComputedStyle(keysInfoArea).transitionDuration) * 1000;
    promiseChange(keyInfoBtn, 'KeyT', transTime, () => keysInfoArea.hidden = true);
}

// Closing key info by clicking
keysInfoArea.onclick = (event) => {
    if (event.target == keyInfoBtn) return;
    if (event.target.closest('.keys-info') && !event.target.closest('#close-info')) return;

    hideKeysInfoArea();
};

/////////////////////
// Global handlers //
/////////////////////

// Hiding preload
function hidePreload() {
    playerContainer.classList.remove('loading');
}

// Highlighting selected track in current playlist
document.addEventListener('click', (event) => {
    if (document.activeElement == document.body) {
        if (highlightActiveElem) cancelReturningFocus();

        setTimeout(() => {
            let isDocScrollbar = checkDocHeight();
            if (isDocScrollbar || !accelerateScrolling ) return;

            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            startScrolling(key);
        });
    }

    if (event.target.closest('#settings-area')) return;
    if (event.target.closest('#visible-playlist-area')) return;
    if (event.target.closest('#tracklist-selection label')) return;
    if (event.target.closest('#keys-info-area')) return;
    if (event.target.closest('i')) return;
    if (!selectedAudio) return;

    highlightSelected(selectedAudio);
});

// Number inputs
let inputTicking = false;

for (let input of document.querySelectorAll('input[type="number"]')) {
    //Filtering keys
    input.onkeydown = (event) => {
        return (event.key >= '0' && event.key <= '9') ||
            event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
            event.code == 'ArrowLeft' || event.code == 'ArrowRight' ||
            event.code == 'Delete' || event.code == 'Backspace' ||
            event.code == 'Tab' || event.key == 'Enter' ||
            (event.ctrlKey && (event.code == 'KeyX' || event.code == 'KeyC' || event.code == 'KeyV'))
        ;
    };

    // Optimization for keyrepeat (ArrowUp, ArrowDown)
    input.addEventListener('keydown', (event) => {
        if ((event.code == 'ArrowUp' || event.code == 'ArrowDown') && event.repeat) {
            if (!inputTicking) {
                inputTicking = true;
                setTimeout(() => inputTicking = false, 50);
            } else {
                event.preventDefault();
            }
        }
    });
}

// Checkbox inputs turn on/off by pressing the Enter key
function connectCheckboxEnterKeyDown(checkboxes) {
    checkboxes.forEach(elem => {
        elem.addEventListener('keydown', function(event) {
            if (event.key == 'Enter') {
                if (this.tagName == 'INPUT') {
                    this.checked = !this.checked;
                    this.dispatchEvent(new Event('change')); 
                } else if (this.tagName == 'LABEL') {
                    let checkbox = document.getElementById(this.getAttribute('for'));
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
    });
}

// Document blur
document.body.onblur = () => {
    setTimeout(() => {
        stopScrollingAndClean();
        stopAccelerationAndClear();
        removeButtonHighlightings();
    });
};

// Connection focus handler
function connectFocusHandler(focusingElems) {
    focusingElems.forEach(elem => {
        elem.onfocus = function(event) {
            if (accelerateScrolling) {
                if (playlistLim.scrollHeight <= playlistLim.clientHeight) return;

                let isDocScrollbar = checkDocHeight();
                let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
                let direction = scrollingKeysData[key].direction;
                let isReachingLimits = checkReachingPlaylistLimits(direction);
    
                // Quickly hide playlist scroll elements
                if (
                    isReachingLimits &&
                    this != visPlaylistArea &&
                    isDocScrollbar &&
                    !cursorOverPlaylist &&
                    !pointerModeScrolling
                ) {
                    clearTimeout(timerHideScrollElems);
                    hideScrollElems();
                }
    
                // Start/stop scrolling
                if (
                    (this.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) ||
                    (this.scrollHeight > this.clientHeight) ||
                    (this != visPlaylistArea && isDocScrollbar && !cursorOverPlaylist && !pointerModeScrolling)
                ) {
                    stopScrolling();
                } else if (
                        this == visPlaylistArea ||
                        !isDocScrollbar ||
                        cursorOverPlaylist ||
                        pointerModeScrolling
                ) {
                    startScrolling(key);
                }
            }
    
            // Cancelling returning focus on highlightActiveElem
            if (this != curPlaylist && highlightActiveElem) {
                cancelReturningFocus();
            }

            // Alignment after auto scrolling delete buttons on focus
            if (this.matches('.button-delete')) {
                playlistLim.onscrollend = () => {
                    showScrollElems();
                    scrollAndAlign({
                        duration: KEY_SCROLL_DURATION,
                        hide: accelerateScrolling ? false : true
                    });

                    playlistLim.onscrollend = () => false;
                };
            } else {
                if (event.relatedTarget && event.relatedTarget.matches('.button-delete')) {
                    playlistLim.onscrollend = () => false;
                }
            }
    
            if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
        };
    });
}

// Stop scrolling on context menu
document.oncontextmenu = () => {
    if (accelerateScrolling) stopScrollingAndClean();
};

// Creating tooltips
function connectTooltipHoverIntents(tooltipElems) {
    tooltipElems.forEach(elem => {
        let hoverIntent = new PlayerHoverIntent({
            elem,
    
            repeatTask: (elem == timeRange || elem == volumeRange) ? true : false,
    
            executeTask() {
                if (!this.elemRect) return;
    
                if (this.elem == timeRange) {
                    let calculatedTime = calcTimeRangeTooltip(this.x1);
    
                    if (calculatedTime) {
                        this.elem.dataset.tooltip = calculatedTime;
                    } else {
                        return;
                    }
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
    });
}

// Promise change on pointer or key event
function promiseChange(btn, key, time, func) {
    new Promise((resolve, reject) => {
        btn.addEventListener('click', rejectPromise);
        document.addEventListener('keyup', rejectPromise);

        setTimeout(resolvePromise, time);

        function resolvePromise() {
            removeListeners();
            resolve();
        }

        function rejectPromise(event) {
            if (event.type == 'keyup' && event.code != key) return;

            removeListeners();
            reject();
        }

        function removeListeners() {
            btn.removeEventListener('click', rejectPromise);
            document.removeEventListener('keyup', rejectPromise);
        }
    }).then(
        func,
        () => {}
    );
}

// Highlighting the pressed button
function highlightButton(btn, key, actionFunc, arg) {
    highlightedBtns.set(key, btn);

    if (actionFunc == downKeyStepAccAction) {
        let keyAccType = stepKeysData[key].accelerationType;

        if (keyAccType != accelerationType) {
            btn.classList.add('key-pressed');
        }

        actionFunc(arg);
    } else {
        btn.classList.add('key-pressed');
    }

    document.addEventListener('keyup', function removeKeyPressedFx(event) {
        if (event.code != key) return;
        document.removeEventListener('keyup', removeKeyPressedFx);
        if (!highlightedBtns.has(key)) return;

        highlightedBtns.delete(key);

        // Checking for duplicates of highlighted buttons
        let removeHighlighting = checkHighlightedBtn();
        if (removeHighlighting) btn.classList.remove('key-pressed');

        function checkHighlightedBtn() {
            for (let highlightedBtn of highlightedBtns.values()) {
                if (highlightedBtn == btn) return false;
            }
            return true;
        }

        if (actionFunc == downKeyStepAccAction) {
            upKeyStepAccAction(key);
        } else {
            actionFunc(arg);
        }
    });
}

function removeButtonHighlightings() {
    for (let [key, btn] of highlightedBtns) {
        btn.classList.remove('key-pressed');
        highlightedBtns.delete(key);
    }
}

// Scroll event
let scrollTicking = false;

document.addEventListener('scroll', function () {
    if (!scrollTicking) {
        requestAnimationFrame(function () {
            checkVisibilityScrollElems();

            scrollTicking = false;
        });
    }
    
    scrollTicking = true;
});

// Resize event
let resizeTick = false;

window.addEventListener('resize', () => {
    if (!resizeTick) {
        requestAnimationFrame(function () {
            checkVisibilityScrollElems();
            compensateScrollbarWidth();

            resizeTick = false;
        });
    }
    
    resizeTick = true;
});
  
function checkVisibilityScrollElems() {
    let playlistContainerRect = playlistContainer.getBoundingClientRect();
    let playlistLimRect = playlistLim.getBoundingClientRect();
    let winHeight = isTouchDevice ? window.innerHeight : document.documentElement.clientHeight;
    let heightShift = (playlistLim.scrollHeight > playlistLim.clientHeight) ? 0 : -SCROLL_ARROW_BOX_HEIGHT;
    let playlistLimVisibleTop = 0;
    let playlistLimVisibleBottom = 0;

    if (playlistContainerRect.top < heightShift) {
        if (playlistLim.scrollHeight > playlistLim.clientHeight) {
            playlistLimVisibleTop = -playlistLimRect.top + SCROLL_ARROW_BOX_HEIGHT;
        }
        
        outerScrollArrowsUp.forEach(arrow => arrow.hidden = false);
    } else {
        outerScrollArrowsUp.forEach(arrow => arrow.hidden = true);
    }

    if (playlistContainerRect.bottom > winHeight - heightShift) {
        if (playlistLim.scrollHeight > playlistLim.clientHeight) {
            playlistLimVisibleBottom = playlistLimRect.bottom - winHeight + SCROLL_ARROW_BOX_HEIGHT;
        }
        
        outerScrollArrowsDown.forEach(arrow => arrow.hidden = false);
    } else {
        outerScrollArrowsDown.forEach(arrow => arrow.hidden = true);
    }

    playlistLim.style.maskImage = (!playlistLimVisibleTop && !playlistLimVisibleBottom) ?
        'none' :
        `linear-gradient(           
            transparent ${playlistLimVisibleTop}px,
            var(--player-color-main) ${playlistLimVisibleTop}px,
            var(--player-color-main) calc(100% - ${playlistLimVisibleBottom}px),
            transparent calc(100% - ${playlistLimVisibleBottom}px)
        )`; 
}

function compensateScrollbarWidth() {
    let winWidth = window.innerWidth;
    let docWidth = Math.max(
        document.body.scrollWidth, document.documentElement.scrollWidth,
        document.body.offsetWidth, document.documentElement.offsetWidth,
        document.body.clientWidth, document.documentElement.clientWidth
    );
    let scrollbarWidth = winWidth - docWidth;

    cssRoot.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');

    //console.log(getComputedStyle(cssRoot).getPropertyValue('--scrollbar-width'));
}

// Playlist scroll arrows handlers
playlistScrollArrowUp.onclick = () => {
    if (playlistScrollArrowUp.classList.contains('inactive')) return;

    playlistScrollArrowDown.classList.remove('inactive');

    playlistLim.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth'
    });

    playlistLim.addEventListener('scrollend', () => {
        checkReachingPlaylistLimits('up');
    }, {once: true});
};

playlistScrollArrowDown.onclick = () => {
    if (playlistScrollArrowDown.classList.contains('inactive')) return;

    playlistScrollArrowUp.classList.remove('inactive');

    playlistLim.scrollTo({
        left: 0,
        top: playlistLim.scrollHeight,
        behavior: 'smooth'
    });

    playlistLim.addEventListener('scrollend', () => {
        checkReachingPlaylistLimits('down');
    }, {once: true});
};

// Outer scroll arrows handlers
outerScrollArrowsUp.forEach(arrow => arrow.addEventListener('click', () => {
    window.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth'
    });
}));

outerScrollArrowsDown.forEach(arrow => arrow.addEventListener('click', () => {
    let scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );

    window.scrollTo({
        left: 0,
        top: scrollHeight,
        behavior: 'smooth'
    });
}));

//////////////////
// Key handlers //
//////////////////

// Playing/pausing/stoping audio
document.addEventListener('keydown', (event) =>  {
    if (event.code == 'Space') event.preventDefault();
    if (
        ((event.code == 'KeyW' && !event.shiftKey) ||
        event.code == 'Space') &&
        !event.repeat
    ) {
        highlightButton(playPauseBtn, event.code, playPauseAction);
    }
    if (event.code == 'KeyS' && !event.shiftKey && !event.repeat) {
        highlightButton(stopBtn, event.code, stopAction);
    }
});

// Stepping/accelerating audio
document.addEventListener('keydown', (event) => {
    if (
        (event.code == 'ArrowLeft' || event.code == 'ArrowRight' ||
        event.code == 'KeyA' || event.code == 'KeyD') &&
        !event.repeat
    ) {
        if (
            (event.code == 'ArrowLeft' || event.code == 'ArrowRight') &&
            document.activeElement.matches('input[type="number"]')
        ) {
            return;
        }

        let btn = stepKeysData[event.code].button;
        highlightButton(btn, event.code, downKeyStepAccAction, event.code);
    }
});

// Randomizing/repeating track/playlist
document.addEventListener('keydown', (event) => {
    if (event.code == 'KeyQ' && !event.repeat) {
        let btn = shuffleBtn.closest('.btn-img-wrapper');
        highlightButton(btn, event.code, shuffleAction);
    }
    if (event.code == 'KeyE' && !event.repeat) {
        let btn = repeatBtn.closest('.btn-img-wrapper');
        highlightButton(btn, event.code, repeatAction);
    }
});

// Changing volume
document.addEventListener('keydown', (event) => {
    if (
        (event.code == 'KeyM' || (event.code == 'KeyR' && !event.shiftKey)) &&
        !event.repeat
    ) {
        highlightButton(volumeBtn, event.code, volumeAction);
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
        highlightButton(configBtn, event.code, changeConfig, idx + 1);
        changeConfig.eventType = event.type;
    }
    if (event.code == 'KeyX' && !event.repeat && !event.ctrlKey) {
        let idx = playerColorsBank.indexOf(playerColor);
        highlightButton(colorBtn, event.code, changePlayerColor, idx + 1);
    }
    if (event.code == 'KeyC' && !event.repeat && !event.ctrlKey) {
        let idx = playlistStylesBank.indexOf(playlistStyle);
        highlightButton(playlistStyleBtn, event.code, changePlaylistStyle, idx + 1);
    }
});

// Showing/hiding settings
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && !event.shiftKey && !event.repeat) {
        highlightButton(settingsBtn, event.code, settingsAction, event.type);
    }
});

// Showing/hiding key info
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyT' && !event.repeat) {
        highlightButton(keyInfoBtn, event.code, keyInfoAction, event.type);
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
        downKeyScrollAction(event);
    }
    if (
        (event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
        event.code == 'PageUp' || event.code == 'PageDown' ||
        event.code == 'Home' || event.code == 'End') &&
        event.repeat
    ) {
        repeatKeyScrollAction(event);
    }
});
document.addEventListener('keyup', (event) =>  {
    if (
        event.code == 'ArrowUp' || event.code == 'ArrowDown' ||
        event.code == 'PageUp' || event.code == 'PageDown' ||
        event.code == 'Home' || event.code == 'End'
    ) {
        upKeyScrollAction(event);
    }
});

//////////////////////////
// Initial touch device //
//////////////////////////

const isTouchDevice = isTouchDeviceCheck();

function isTouchDeviceCheck() {
    if (
        ('ontouchstart' in window) ||
        (window.DocumentTouch && document instanceof DocumentTouch)
    ) {
        return true;
    }
  
    let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');

    return window.matchMedia(query).matches;
}

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

        highlightSelected(selectedAudio);

        localStorage.setItem('buttons_configuration', newValue);

        if (newValue != oldValue) {
            configBtn.parentElement.classList.remove('rotate');

            let rotateTime = (changeConfig.eventType == 'keydown') ? LAG : 0;

            setTimeout(() => {
                configBtn.parentElement.classList.add('rotate');

                let transTime = parseFloat(getComputedStyle(configBtn.parentElement).animationDuration) * 1000;
                promiseChange(configBtn, 'KeyZ', transTime, () => configBtn.parentElement.classList.remove('rotate'));
            }, rotateTime);
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

function changeConfig(idx) {
    config = configsBank[idx] || configsBank[0];
    playerControls.setAttribute('config', config);
}

/////////////////////////////
// Initial player coloring //
/////////////////////////////

const playerColorsBank = ['black', 'white'];
let playerColor = localStorage.getItem('player_color');

function changePlayerColor(idx) {
    highlightSelected(selectedAudio);

    playerContainer.classList.remove('color-' + playerColor);
    playerColor = playerColorsBank[idx] || playerColorsBank[0];
    localStorage.setItem('player_color', playerColor);
    playerContainer.classList.add('color-' + playerColor);

    console.log('player color = ' + playerColor);

    player.classList.add('changing-color');
    let transTime = parseInt(getComputedStyle(cssRoot).getPropertyValue('--transition-time-main'));
    promiseChange(colorBtn, 'KeyX', transTime, () => player.classList.remove('changing-color'));
}

////////////////////////////
// Initial playlist style //
////////////////////////////

const playlistStylesBank = ['smooth', 'strict'];
let playlistStyle = localStorage.getItem('playlist_style');

function changePlaylistStyle(idx) {
    highlightSelected(selectedAudio);

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

function changeVolume(value) {
    if (value == null) value = DEFAULTS_DATA['player_volume'];

    settedVolume = +value;
    savedVolume = settedVolume ? settedVolume : DEFAULTS_DATA['player_volume'];

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

const visibleTracksInput = document.getElementById('visible-tracks-input');
const visibleTracksCheckbox = document.getElementById('visible-tracks-checkbox');
let numOfVisTracks = localStorage.getItem('number_of_visible_tracks');

function initVisibleTracksCheckbox() {
    let isChecked = localStorage.getItem('visible_tracks_checkbox_checked');
    visibleTracksCheckbox.checked = isChecked === 'true';
}

visibleTracksCheckbox.onchange = function() {
    let value = this.checked ? +visibleTracksInput.value : null;
    changeNumberOfVisibleTracks(value);
};

visibleTracksInput.oninput = () => {
    let value = +visibleTracksInput.value;
    changeNumberOfVisibleTracks(value);
};

function changeNumberOfVisibleTracks(value) {
    let label = visibleTracksCheckbox.parentElement.querySelector('label');
    
    if (value == null || !visibleTracksCheckbox.checked) {
        visibleTracksCheckbox.checked = false;
        visibleTracksInput.disabled = true;
        label.setAttribute('for', visibleTracksCheckbox.id);

        value = DEFAULTS_DATA[`visible-tracks__${config}-config`];
    } else {
        visibleTracksCheckbox.checked = true;
        visibleTracksInput.disabled = false;
        label.setAttribute('for', visibleTracksInput.id);
    
        let minValue = +visibleTracksInput.min;
        let maxValue = +visibleTracksInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    numOfVisTracks = value;
    if (visibleTracksInput.value !== numOfVisTracks) visibleTracksInput.value = numOfVisTracks;
    playlistLim.style.setProperty('--visible-tracks', numOfVisTracks);
    localStorage.setItem('number_of_visible_tracks', numOfVisTracks);
    localStorage.setItem('visible_tracks_checkbox_checked', visibleTracksCheckbox.checked);

    checkPlaylistScrollability();
    checkVisibilityScrollElems();
    compensateScrollbarWidth();

    if (accelerateScrolling) {
        let isDocScrollbar = checkDocHeight();

        if (isDocScrollbar) {
            stopScrolling();
        } else {
            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            if (key == 'ArrowUp' || key == 'ArrowDown') return;
            
            startScrolling(key);
        }
    }

    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
}

/////////////////////////////////////
// Initial scroll elements opacity //
/////////////////////////////////////

const scrollElemsOpacityInput = document.getElementById('scroll-elements-opacity-input');
let scrollElemsOpacity = localStorage.getItem('scroll_elements_opacity');

scrollElemsOpacityInput.oninput = () => {
    let value = +scrollElemsOpacityInput.value;
    changeScrollElemsOpacity(value);
};

function changeScrollElemsOpacity(value) {
    if (value == null) {
        value = DEFAULTS_DATA['scroll-elements-opacity'];
    } else {
        let minValue = +scrollElemsOpacityInput.min;
        let maxValue = +scrollElemsOpacityInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    scrollElemsOpacity = value;
    if (scrollElemsOpacityInput.value !== scrollElemsOpacity) scrollElemsOpacityInput.value = scrollElemsOpacity;
    localStorage.setItem('scroll_elements_opacity', scrollElemsOpacity);

    playlistContainer.style.setProperty('--scroll-elems-opacity', scrollElemsOpacity / 100);

}

///////////////////////////////
// Initial wheel scroll step //
///////////////////////////////

const wheelScrollStepInput = document.getElementById('wheel-scroll-step-input');
let wheelScrollStep = localStorage.getItem('wheel_scroll_step');

wheelScrollStepInput.oninput = () => {
    let value = +wheelScrollStepInput.value;
    changeWheelScrollStep(value);
};

function changeWheelScrollStep(value) {
    if (value == null) {
        value = DEFAULTS_DATA['wheel-scroll-step'];
    } else {
        let minValue = +wheelScrollStepInput.min;
        let maxValue = +wheelScrollStepInput.max;
        value = (value < minValue) ? minValue : ((value > maxValue) ? maxValue : Math.round(value));
    }

    wheelScrollStep = value;
    if (wheelScrollStepInput.value !== wheelScrollStep) wheelScrollStepInput.value = wheelScrollStep;
    localStorage.setItem('wheel_scroll_step', wheelScrollStep);
}

/////////////////////////////////
// Initial tracklist selection //
/////////////////////////////////

const addOptionsCheckbox = document.getElementById('additional-options-checkbox');

function initAddOptionsCheckbox() {
    let isChecked = localStorage.getItem('add_options_checkbox_checked');
    addOptionsCheckbox.checked = isChecked === 'true';
}

addOptionsCheckbox.onchange = function() {
    showHideAddOptions(this.checked);
};

function showHideAddOptions(isChecked) {
    if (isChecked == null) isChecked = addOptionsCheckbox.checked = false;
    localStorage.setItem('add_options_checkbox_checked', isChecked);

    if (isChecked) {
        playerContainer.classList.add('add-options-active');
    } else {
        playerContainer.classList.remove('add-options-active');

        tracklistSelection.querySelectorAll('input[type="checkbox"]').forEach(chBox => {
            chBox.checked = true;
            if (chBox.matches('[id$="all"]')) chBox.classList.remove('partial-list');
        });
    }

    // List text indent calculation
    tracklistSelection.querySelectorAll('.tracklist-details').forEach(tracklistDetails => {
        let list = tracklistDetails.querySelector('.list');
        let checkboxWidth;
        let orderWidth = 0;

        for (let li of list.children) {
            let checkboxLabel = li.querySelector('input[type="checkbox"] + label');
            let orderSpanWidth = li.querySelector('.order > span').offsetWidth;

            if (!checkboxWidth) checkboxWidth = checkboxLabel.offsetWidth;
            orderWidth = (orderSpanWidth > orderWidth) ? orderSpanWidth : orderWidth;
        }

        let listTextIndent = checkboxWidth + orderWidth;
    
        list.style.setProperty('--list-text-indent', listTextIndent + 'px');
        list.style.setProperty('--order-width', orderWidth + 'px');
    });
}

tracklistSelection.onclick = (event) => {
    let target;

    if (target = event.target.closest('i')) {
        console.log('playlist changed');

        let tracklist = null;
        let clearPlaylist = true;

        if (target.matches('[class^="icon-list"]')) {
            let list = target.closest('.tracklist-section').querySelector('.list');
            tracklist = processSelectedTracklist(list);
            clearPlaylist = target.hasAttribute('data-clear') ? true : false;

            function processSelectedTracklist(list) {
                let tracklist = [];
            
                for (let track of list.children) {
                    let isChecked = track.firstElementChild.checked;
                    if (!isChecked) continue;
            
                    let artist = track.querySelector('.track-artist').textContent;
                    let title = track.querySelector('.track-title').textContent;
                    let src = track.dataset.src;
            
                    tracklist.push({artist, title, src});
                }
            
                return tracklist.length ? tracklist : null;
            }
        }

        createPlaylist(tracklist, clearPlaylist);
        checkPlaylistScrollability();
        checkVisibilityScrollElems();

        if (tracklist) {
            if (shuffleBtn.classList.contains('active')) randomizePlaylist();
            highlightSelected(selectedAudio);
        }
    }

    if (target = event.target.closest('.tracklist-title')) {
        const tracklistDetails = target.closest('.tracklist-section').querySelector('.tracklist-details');

        if (!tracklistDetails.style.height) tracklistDetails.style.height = 0;

        connectCheckboxLabelsFocus(tracklistDetails);
        setCheckboxChangeHandlers(tracklistDetails);

        if (tracklistDetails.style.height === '0px') {
            tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
        } else {
            tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
            tracklistDetails.offsetHeight; // 'Apply' height value
            tracklistDetails.style.height = 0;
        }

        tracklistDetails.ontransitionend = function() {
            if (tracklistDetails.style.height !== '0px') {
                tracklistDetails.style.height = 'auto';
            }
        };

        function connectCheckboxLabelsFocus(tracklistDetails) {
            let checkboxLabels = tracklistDetails.querySelectorAll('label.designed-checkbox');
            checkboxLabels.forEach(label => label.tabIndex = (tracklistDetails.style.height == '0px') ? 0 : -1);
        }

        function setCheckboxChangeHandlers(tracklistDetails) {
            let checkboxAll = tracklistDetails.querySelector('header input[type="checkbox"]');
            let listCheckboxes = tracklistDetails.querySelectorAll('.list input[type="checkbox"]');

            if (tracklistDetails.style.height == '0px') {
                checkboxAll.onchange = () => {
                    listCheckboxes.forEach(chBox => chBox.checked = checkboxAll.checked);
                    checkboxAll.classList.remove('partial-list');
                };

                listCheckboxes.forEach(chBox => {
                    chBox.onchange = () => {
                        let checkedListCheckboxes = tracklistDetails.
                            querySelectorAll('.list input[type="checkbox"]:checked');

                        checkboxAll.checked = listCheckboxes.length == checkedListCheckboxes.length;

                        if (
                            !checkedListCheckboxes.length ||
                            checkedListCheckboxes.length == listCheckboxes.length
                        ) {
                            checkboxAll.classList.remove('partial-list');
                        } else {
                            checkboxAll.classList.add('partial-list');
                        }
                    };
                });
            } else {
                checkboxAll.onchange = () => false;
                listCheckboxes.forEach(chBox => chBox.onchange = () => false);
            }
        }
    }
};

///////////////////////
// Playlist creation //
///////////////////////

let curTracklist = JSON.parse(localStorage.getItem('current_tracklist')) ||
    DEFAULTS_DATA['first-tracklist'] ||
    [];

function createPlaylist(addedTracklist, clearPlaylist) {
    if (addedTracklist) addedTracklist = JSON.parse(JSON.stringify(addedTracklist));

    if (clearPlaylist) {
        if (selectedAudio) {
            selectedAudio.setAttribute('data-relocated', '');
            tempTrackBox.append(selectedAudio.parentElement);
        }

        playlist.innerHTML = '';
        originOrderedAudios.length = 0;

        if (addedTracklist) { // Replace playlist
            curTracklist = addedTracklist;
        } else { // Only clear playlist
            curTracklist.length = 0;
            curOrderedAudios.length = 0;
            curPlaylist.value = 'Playlist cleared';
        }
    } else { // Add to playlist
        curTracklist = addedTracklist ? curTracklist.concat(addedTracklist) : [];
    }

    // Marking duplicates
    for (let track of curTracklist) {
        delete track['dub'];
    }

    for (let i = 0; i < curTracklist.length; i++) {
        let artist = curTracklist[i]['artist'];
        let title = curTracklist[i]['title'];
        let dub = curTracklist[i]['dub'];

        if (!dub) {
            let k = 1;
    
            for (let j = i + 1; j < curTracklist.length; j++) {
                let comparedArtist = curTracklist[j]['artist'];
                let comparedTitle = curTracklist[j]['title'];
        
                if (comparedArtist === artist && comparedTitle === title) {
                    if (++k > 1) curTracklist[j]['dub'] = k;
                }
            }
        }
    }

    localStorage.setItem('current_tracklist', JSON.stringify(curTracklist));

    if (!addedTracklist) return;
    
    // Creation HTML elements
    for (let track of addedTracklist) {
        let artist = track['artist'];
        let title = track['title'];
        let src = track['src'];
        let dub = track['dub'];

        let trackElem = document.createElement('div');
        trackElem.className = 'track';
        playlist.appendChild(trackElem);
    
        let audioElem = document.createElement('audio');
        audioElem.setAttribute('data-artist', artist);
        audioElem.setAttribute('data-title', title);
        src += '?nocache=' + Math.random(); // Тестовая очистка кэша
        audioElem.setAttribute('data-src', src);
        if (dub) audioElem.setAttribute('data-dub', dub);
        audioElem.setAttribute('type', 'audio/mpeg');
        audioElem.setAttribute('preload', 'auto');
        trackElem.appendChild(audioElem);

        let additionalsElem = document.createElement('div');
        additionalsElem.className = 'additionals';
        trackElem.appendChild(additionalsElem);

        let deleteElem = document.createElement('button');
        deleteElem.className = 'button-delete';
        deleteElem.setAttribute('data-tooltip', 'Remove track');
        deleteElem.innerHTML =  '<i class="icon-cancel"></i>';
        additionalsElem.appendChild(deleteElem);
        connectFocusHandler([deleteElem]);
        connectTooltipHoverIntents([deleteElem]);

        let loadElem = document.createElement('div');
        loadElem.className = 'loading-figure';
        additionalsElem.appendChild(loadElem);
    
        let limiterElem = document.createElement('div');
        limiterElem.className = 'screen-limiter';
        trackElem.appendChild(limiterElem);
    
        let trackTitleElem = document.createElement('span');
        trackTitleElem.className = 'track-title';
        trackTitleElem.textContent = artist + ' \u2013 ' + title;
        if (dub) trackTitleElem.textContent += ' (' + dub + ')';
        limiterElem.appendChild(trackTitleElem);

        originOrderedAudios.push(audioElem);
    }
    
    setOriginPlaylist();
}

//////////////////////////////////
// Last played track start info //
//////////////////////////////////

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

function saveLastPlayedAudioInfo(audio) {
    let lastPlayedAudio = 'last_played_audio=' +
        encodeURIComponent(audio.dataset.artist + ' - ' + audio.dataset.title);
    let lastPlayDate = 'date_of_last_play=' + new Date();
    let dateExpires = new Date(Date.now() + 864000e3).toUTCString(); // Delete cookies after 10 days
    
    document.cookie = `${lastPlayedAudio}; path=/; expires=${dateExpires}`;
    document.cookie = `${lastPlayDate}; path=/; expires=${dateExpires}`;
}

////////////////////////////////////
// Run initials and window onload //
////////////////////////////////////

runInitials();

function runInitials() {
    initVisibleTracksCheckbox();
    initAddOptionsCheckbox();
    connectFocusHandler(document.querySelectorAll(
        `input:not([id^="checkbox-tracklist"]),
        label.designed-checkbox,
        button,
        textarea,
        #visible-playlist-area`
    ));
    connectCheckboxEnterKeyDown(document.querySelectorAll(
        `input[type="checkbox"]:not([id^="checkbox-tracklist"]),
        label.designed-checkbox`
    ));
    connectTooltipHoverIntents(playerContainer.querySelectorAll('[data-tooltip]'));
    changeConfig(configsBank.indexOf(config));
    changePlayerColor(playerColorsBank.indexOf(playerColor) );
    changePlaylistStyle(playlistStylesBank.indexOf(playlistStyle));
    changeVolume(settedVolume);
    changeScrollElemsOpacity(scrollElemsOpacity);
    changeWheelScrollStep(wheelScrollStep);
    createPlaylist(curTracklist, true);
    changeNumberOfVisibleTracks(numOfVisTracks);
}

window.addEventListener('load', () => {
    showHideAddOptions(addOptionsCheckbox.checked);
    hidePreload();
    showLastPlayedTrackInfo();
});

// Temporary check handler
document.addEventListener('keydown', (event) => {
    if (event.code == 'KeyG') {
        console.log(document.activeElement);
    }
});