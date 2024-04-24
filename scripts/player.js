import { tracklistObjData } from './tracklists.js';
import { getScrollbarWidth, eventManager } from './function_storage.js';
import { configClassic } from './controls-config-classic.js';
import { configStylish } from './controls-config-stylish.js';
import { PlayerHoverIntent } from './player-hover-intent.js';

console.log(localStorage);
//localStorage.clear();

// Constants-anchors
const cssRoot = document.querySelector(':root');
const preloader = document.getElementById('preloader');
const playerContainer = document.getElementById('player-container');
const tracklistDatabase = document.getElementById('tracklist-database');
const tracklistDtbsTitle = tracklistDatabase.querySelector('#tracklist-database-title');
const tracklistsContainer = document.getElementById('tracklists-container');
const tracklistDtbsAddControls = tracklistDatabase.querySelector('.add-controls');
const expandAllTrlDetailsBtn = document.getElementById('expand-all-tracklist-details');
const collapseAllTrlDetailsBtn = document.getElementById('collapse-all-tracklist-details');
const clearPlaylistBtn = document.getElementById('clear-playlist');
const tracklistDtbsBtn = document.getElementById('tracklist-database-button');
const tracklistDtbsBtnCont = tracklistDtbsBtn.parentElement;
const player = document.getElementById('player');
const tooltip = document.getElementById('tooltip');
const startInfoDisplay = document.getElementById('start-info-display');
const trackTitleDisplay = document.getElementById('title-display');
const artistNameDisplay = document.getElementById('artist-display');
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
const playlistScrollArrowUp = document.getElementById('playlist-scroll-arrow-up');
const playlistScrollArrowDown = document.getElementById('playlist-scroll-arrow-down');
const tempTrackBox = document.getElementById('temporary-track-box');
const configBtn = document.getElementById('configuration');
const colorBtn = document.getElementById('coloring');
const playlistStyleBtn = document.getElementById('playlist-style');
const settingsBtn = document.getElementById('settings');
const keysInfoBtn = document.getElementById('info');
const settingsArea = document.getElementById('settings-area');
const curPlaylist = document.getElementById('current-playlist');
const docScrollArrowsContainer = document.getElementById('document-scroll-arrows-container');
const docScrollArrowUp = document.getElementById('document-scroll-arrow-up');
const docScrollArrowDown = document.getElementById('document-scroll-arrow-down');
const keysInfoArea = document.getElementById('keys-info-area');
const tracklistDelConfirm = document.getElementById('tracklist-deletion-confirmation');

// Calculated and transformed constants
const 
    initPlayerContainerStyle = getComputedStyle(playerContainer),
    initTracklistDtbsStyle = getComputedStyle(tracklistDatabase),
    playerContainerPaddingBottom = parseInt(initPlayerContainerStyle.paddingBottom),
    commonBorderRadius = parseInt(initPlayerContainerStyle.getPropertyValue('--common-border-radius')),
    commonSpacing = parseInt(initPlayerContainerStyle.getPropertyValue('--common-spacing')),
    minTracklistDtbsWidth = parseInt(initTracklistDtbsStyle.minWidth),
    maxTracklistDtbsWidth = parseInt(initTracklistDtbsStyle.maxWidth),
    settingsAreaWidth = getSettingsAreaWidth(),
    defTracklistDtbsBtnHeight = parseInt(getComputedStyle(tracklistDtbsBtnCont).getPropertyValue('--default-height')),
    siteFooterHeight = parseInt(getComputedStyle(cssRoot).getPropertyValue('--site-footer-height')),
    playlistScrollArrowBoxHeight = playlistContainer.querySelector('.playlist-scroll-arrow-box').offsetHeight,
    timelineMrgnLeft = Math.abs(parseInt(getComputedStyle(timeline).marginLeft)), 
    trackHeight = parseInt(getComputedStyle(playlistLim).getPropertyValue('--track-height')),
    scrollbarWidth = getScrollbarWidth(),
    hasScrollend = 'onscrollend' in window
;

// Setted constants
const TIMELINE_POSITION_CHANGE_STEP = 0.5;
const TIMELINE_UPDATE_INTERVAL = 200;
const LAG = 16.7;
const ACCELERATION_FACTOR = 5;
const ACCELERATION_DELAY = 750;
const DEFAULT_SCROLLING_TIME = 150;
const KEY_SCROLLING_TIME = 120;
const PLAYLIST_FINISH_DELAY = 500;
const HIDE_SCROLL_ELEMENTS_DELAY = 500;
const RETURN_FOCUS_DELAY = 500;

// Constants-collections and other
const origOrderedAudios = [],
    curOrderedAudios = [],
    orderedDownloads = [],
    fixedCurPlaylistStrings = new Map(),
    highlightedBtns = new Map(),
    activeScrollKeys = new Set(),
    activeStepAccKeys = new Set(),
    canceledStepAccKeys = new Set(),
    titleMoveTimers = {},
    trlDetailsAnimationFrameIds = {},
    eventTracklistDtbsAnimationEnd = new CustomEvent('tracklistDtbsAnimationEnd'),
    eventScrollAndAlignPlaylistEnd = new CustomEvent('scrollAndAlignPlaylistEnd'),
    eventRemovingTracksEnd = new CustomEvent('removingTracksEnd')
;

// Variables
let accelerateScrolling = false;
let pointerModeScrolling = false;
let activeScrollAndAlign = false;
let activeScrollOnKeyRepeat = false;
let activeScrollInPointerMode = false;
let cursorOverPlaylist = false;
let scrollablePlaylist = false;
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
let timerReturnFocusDelay = null;
let timerAccelerateScrolling = null;
let requestCheckCurTime = null;
let requestAligningScroll = null;
let requestScrollInPointerMode = null;
let requestScrollOnKeyRepeat = null;
let highlightActiveElem = null;
let playlistLimScrollDirection = null;
let playlistLimScrollTop = 0;
let curAccelerateKey = null;
let acceleratePlaying = true;
let acceleration = false;
let accelerationType = 'none';
let removingTracksNum = 0;
let timeRangeHoverIntent = {};
let volumeRangeHoverIntent = {};

defineProperty('selectedAudio', undefined);

function defineProperty(propertyName, audio) {
    Object.defineProperty(window, propertyName, {
        get() {
            return audio;
        },
        set(newAudio) {
            if (propertyName != 'selectedAudio') return;

            if (audio && audio.hasAttribute('data-removed') && audio != newAudio) {
                audio.parentElement.remove();
            }
            
            audio = newAudio;
        }
    });
}

const DEFAULTS_DATA = {
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

const scrollEndStates = new Proxy(
    {
        curPlaylist: true,
        document: true
    },
    {
        set(target, prop, value, receiver) {
            target[prop] = value;

            if (value == true) {
                let isAllScrollsEnded = true;

                for (let val of Object.values(target)) {
                    if (!val) {
                        isAllScrollsEnded = false;
                        break;
                    }
                }

                if (isAllScrollsEnded && highlightActiveElem) {
                    clearTimeout(timerReturnFocusDelay);
                
                    timerReturnFocusDelay = setTimeout(() => {
                        let preventScroll = (highlightActiveElem == visPlaylistArea) ? true : false;
                
                        highlightActiveElem.focus({preventScroll});
                        highlightActiveElem = null;
                    }, RETURN_FOCUS_DELAY);
                }
            }

            return Reflect.set(target, prop, value, receiver);
        }
    }
);

/////////////////////////
// Selected track info //
/////////////////////////

function showTrackInfo(audio, prevSelected = null) {
    startInfoDisplay.hidden = true;

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

timeRange.oncontextmenu = () => {
    if (isTouchDevice) return false;
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
        timeline.style.width = (timelineMrgnLeft + xPos) + 'px';

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
        
        removeSelected(prevSelectedAudio);
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

    removeSelected(prevSelectedAudio);
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

    highlightSelected(selectedAudio);
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
    
    timeline.style.width = `calc(${timelineMrgnLeft}px + ${timelineWidth}%)`;
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
                    timelinePos = timeline.offsetWidth - timelineMrgnLeft;
                    isTrackFinished = timelinePos >= timeRange.offsetWidth;
                    break;
                case 'fast-rewind':
                    timeline.style.width = `calc(${timeline.offsetWidth}px - ${TIMELINE_POSITION_CHANGE_STEP}%)`;
                    timelinePos = timeline.offsetWidth - timelineMrgnLeft;
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

        removeSelected(prevSelectedAudio);
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

    scrollEndStates.curPlaylist = false;
    scrollEndStates.document = false;

    timerFinishPlay = setTimeout(() => {
        stopAccelerationAndClear();

        trackTitleDisplay.textContent = '';
        artistNameDisplay.textContent = '';

        updateTime(null, '--:--');
        updateDuration(null, '--:--');

        if (timeRangeHoverIntent.elemRect) timeRangeHoverIntent.dismissTask();
        timePosSeeking = false;
        timeline.style.width = `${timelineMrgnLeft}px`;
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

        (function resetScrollPositionsAndReturnFocus() {
            let isScrollAndAlignPlaylistActive = false;

            if (playlistLim.scrollTop) {
                scrollAndAlignPlaylist({
                    direction: 'up',
                    deltaHeight: playlistLim.scrollTop,
                    align: false,
                    hide: true
                });
    
                isScrollAndAlignPlaylistActive = true;
            }

            if (!highlightActiveElem) highlightActiveElem = document.activeElement;

            curPlaylist.select();
            curPlaylist.setSelectionRange(0, 0);
            if (curPlaylist != highlightActiveElem) curPlaylist.blur();
    
            if (isScrollAndAlignPlaylistActive) {
                eventManager.addOnceEventListener(document, 'scrollAndAlignPlaylistEnd', resetScrollbarPositions);
            } else {
                resetScrollbarPositions();
            }
        })();

        timerFinishPlay = null;
    }, PLAYLIST_FINISH_DELAY);
    
    highlightSelected(selectedAudio);

    function resetScrollbarPositions() {
        // Current playlist
        curPlaylist.scrollTo({
            left: 0,
            top: 0,
            behavior: 'smooth'
        });
    
        if (curPlaylist.scrollTop && hasScrollend) {
            eventManager.addOnceEventListener(curPlaylist, 'scrollend', () => scrollEndStates.curPlaylist = true);
        } else {
            scrollEndStates.curPlaylist = true;
        }
    
        // Document
        window.scrollTo({
            left: window.scrollX,
            top: 0,
            behavior: 'smooth'
        });
    
        if (window.scrollY && hasScrollend) {
            window.targetScrollPosY = 0;
            eventManager.addOnceEventListener(document, 'scrollend', () => scrollEndStates.document = true);
        } else {
            scrollEndStates.document = true;
        }
    }
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
        setOrigPlaylistOrder();
    }

    if (selectedAudio) {
        highlightSelected(selectedAudio);
    } else {
        curPlaylist.scrollTo({
            left: 0,
            top: 0,
            behavior: 'smooth'
        });
    }
};

function setOrigPlaylistOrder() {
    if (!origOrderedAudios.length) return;

    console.log('original track order');

    curOrderedAudios.length = 0;

    let curPlaylistText = 'Current playlist (origin order):\n\n';

    origOrderedAudios.forEach((audio, idx, array) => {
        curOrderedAudios.push(audio);
        
        curPlaylistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
        if (audio.dataset.dub) curPlaylistText += ' (' + audio.dataset.dub + ')';
        if (array[idx + 1]) curPlaylistText += '\n';
    });

    breakLine(curPlaylistText);
}

function randomizePlaylist() {
    if (!curOrderedAudios.length) return;

    console.log('random track order');

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

volumeRange.oncontextmenu = () => {
    if (isTouchDevice) return false;
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
    if (!event.target.hasAttribute('data-actionable')) return;

    let activeTrackInfo = event.target;
    let activeTrackInfoLim = activeTrackInfo.parentElement;
    
    activeTrackInfoLim.classList.add('hover');
    adjustPlaylistLimiterWidth(activeTrackInfo);
    
    activeTrackInfo.onpointerleave = () => {
        activeTrackInfoLim.classList.remove('hover');
        if (!removingTracksNum) playlistLim.style.width = '';

        activeTrackInfo.onpointerleave = () => false;
    };
};

function adjustPlaylistLimiterWidth(activeTrackInfo) {
    if (removingTracksNum) return;
    
    let activeTrackInfoLeft = activeTrackInfo.getBoundingClientRect().left + window.scrollX;
    let playlistLimLeft = playlistLim.getBoundingClientRect().left + window.scrollX;
    let activeTrackInfoLim = activeTrackInfo.parentElement;
    let activeTrackInfoWidth = activeTrackInfo.offsetWidth;
    let playlistWidth = playlist.offsetWidth;

    if (activeTrackInfoLeft - playlistLimLeft + activeTrackInfoWidth + commonSpacing <= playlistWidth) {
        playlistLim.style.width = '';
        return;
    }

    let docWidth = getDocWidth();
    let shift = isTouchDevice ? 1 : 0; // Bug on some mobile devices

    if (activeTrackInfoLim.hasAttribute('data-animating')) {
        playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';

        eventManager.addOnceEventListener(activeTrackInfoLim, 'transitionend', () => {
            activeTrackInfoLim.removeAttribute('data-animating');

            if (activeTrackInfo.matches(':hover')) {
                if (activeTrackInfoLim.classList.contains('hover')) {
                    extendWidth();
                } else { // Works on touchscreen
                    playlistLim.style.width = '';
                }
            }
        });
    } else {
        extendWidth();
    }

    function extendWidth() {
        activeTrackInfoLeft = activeTrackInfo.getBoundingClientRect().left + window.scrollX;
        activeTrackInfoWidth = activeTrackInfo.offsetWidth;

        if (activeTrackInfoLeft - playlistLimLeft + activeTrackInfoWidth + commonSpacing > playlistWidth) {
            playlistLim.style.width = activeTrackInfoLeft - playlistLimLeft + activeTrackInfoWidth + commonSpacing + 'px';
        }
        if (activeTrackInfoLeft + activeTrackInfoWidth + commonSpacing > docWidth) {
            playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';
        }
    }
}

// Playlist focus and text select handlers
visPlaylistArea.addEventListener('pointerdown', function (event) {
    let outOfVisibleArea = event.clientX > this.getBoundingClientRect().right;
    if (outOfVisibleArea) preventFocus(this);

    if (event.pointerType == 'mouse' && event.button == 1) return;

    if (event.target.closest('.track-info-box')) {
        let trackInfoBox = event.target.closest('.track-info-box');

        if (
            event.target.matches('.artist-name') ||
            event.target.matches('.track-title') ||
            event.target.matches('.status') ||
            event.target.matches('.display-progress')
        ) {
            preventFocus(this);
            preventFocus(trackInfoBox);

            // Prohibiting text selection on the touchscreen
            if (isTouchDevice && event.isPrimary && event.target.hasAttribute('data-actionable')) {
                let activeTrackInfo = event.target;
                activeTrackInfo.style.userSelect = 'none';

                document.addEventListener('pointerup', () => activeTrackInfo.style.userSelect = '', {once: true});
            }
        } else { // Focus handling
            if (document.activeElement == trackInfoBox) {
                event.preventDefault();
                setTimeout(() => trackInfoBox.focus());
            } else {
                trackInfoBox.removeAttribute('tabindex');
                this.focus({preventScroll: true});
                setTimeout(() => trackInfoBox.setAttribute('tabindex', 0));
            }
        }
    } else if (event.target.matches('.remove-track')) {
        preventFocus(this);
    }

    function preventFocus(elem) {
        elem.removeAttribute('tabindex');
        setTimeout(() => elem.setAttribute('tabindex', 0));
    }
});

visPlaylistArea.onclick = (event) => {
    // Artist name or track title
    if (event.target.hasAttribute('data-actionable')) {
        let track = event.target.closest('.track');
        selectTrackInPlaylist(track);
    }

    // Remove track button
    if (event.target.closest('.remove-track')) {
        let track = event.target.closest('.track');
        removeTrackFromPlaylist(track, event.type);
    }
};

function selectTrackInPlaylist(track) {
    if (document.getSelection().toString().length) return;

    let newAudio = track.querySelector('audio');

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

        removeSelected(prevSelectedAudio);
        selectedAudio = newAudio;
        setSelected(selectedAudio);

        prevSelectedAudio.currentTime = 0;
        selectedAudio.currentTime = 0;
        timelinePos = 0;
    
        showTrackInfo(selectedAudio, prevSelectedAudio);
    } else {
        selectedAudio.currentTime = 0;
        timelinePos = 0;

        showTrackInfo(selectedAudio, selectedAudio);
    }

    playAudio(selectedAudio);
}

function removeTrackFromPlaylist(track, eventType = null) {
    if (track.classList.contains('removing')) return;

    removingTracksNum++;

    if (scrollablePlaylist) showScrollElems();

    let audio = track.querySelector('audio');
    let trackInfoBox = track.querySelector('.track-info-box');
    let docWidth = getDocWidth();
    let playlistLimLeft = playlistLim.getBoundingClientRect().left + window.scrollX;

    playlistLim.style.width = docWidth - playlistLimLeft + 'px';
    
    // If a track is being added, set the current property values when starting the removal animation
    if (track.classList.contains('not-ready')) {
        let trackStyle = getComputedStyle(track);
        let transformMatrix = trackStyle.transform;
        // transformMatrix == 'matrix(scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY())'
        let numberRegexp = /-?\d+\.?\d*/g;
        let numberPattern = transformMatrix.match(numberRegexp); // [x, 0, 0, y, 0, 0]
        let curScaleXY = numberPattern[0] + ', ' + numberPattern[3];
        track.style.transform = `scale(${curScaleXY})`;

        let curOpacity = trackStyle.opacity;
        track.style.opacity = curOpacity;

        let curHeight = trackStyle.height;
        track.style.height = curHeight;

        track.classList.remove('not-ready');
        track.classList.remove('adding');
    }

    track.classList.remove('pending-removal');
    track.classList.add('removing');

    eventManager.addOnceEventListener(track, 'animationend', () => {
        console.log('remove track from playlist | ' + audio.dataset.title);

        removingTracksNum--;

        // If focused elem == track title => set focus on another elem
        if (eventType == 'keydown' && document.activeElement == trackInfoBox) {
            let nextTrack = track.nextElementSibling || track.previousElementSibling;
            let nextFocusedElem = nextTrack ?
                nextTrack.querySelector('.track-info-box') :
                tracklistsContainer.querySelector('.tracklist-section');

            if (
                !settingsArea.hidden &&
                selectedAudio &&
                audio != selectedAudio &&
                !selectedAudio.hasAttribute('data-removed')
            ) {
                highlightActiveElem = nextFocusedElem;
            } else {
                nextFocusedElem.focus();
            }
        }

        // Cutting audio from arrays
        let origIdx = origOrderedAudios.indexOf(audio);
        origOrderedAudios.splice(origIdx, 1);
        curTracklist.splice(origIdx, 1);

        let curIdx = curOrderedAudios.indexOf(audio);
        curOrderedAudios.splice(curIdx, 1);

        // Removing track element from playlist
        if (audio == selectedAudio) {
            track.classList.remove('removing');
            audio.setAttribute('data-removed', '');
            tempTrackBox.append(track);
        } else {
            track.remove();
        }

        // Recounting duplicates
        let artist = audio.dataset.artist;
        let title = audio.dataset.title;

        for (let i = origIdx; i < curTracklist.length; i++) {
            let comparedArtist = curTracklist[i].artist;
            let comparedTitle = curTracklist[i].title;

            if (comparedArtist == artist && comparedTitle == title) {
                let dub = --curTracklist[i].dub;

                if (dub > 1) {
                    curTracklist[i].dub = dub;
                    origOrderedAudios[i].dataset.dub = dub; // curOrderedAudios will be updated
                } else {
                    dub = null;
                    delete curTracklist[i].dub;
                    delete origOrderedAudios[i].dataset.dub; // curOrderedAudios will be updated
                }

                let playlistArtistName = playlist.children[i].querySelector('.artist-name');
                let playlistTrackTitle = playlist.children[i].querySelector('.track-title');
                playlistArtistName.textContent = artist;
                playlistTrackTitle.textContent = title;
                if (dub) playlistTrackTitle.textContent += ' (' + dub + ')';
            }
        }

        // Cutting string from curPlaylist textarea
        if (curOrderedAudios.length) {
            let textMark = '\n\n';
            let textMarkEndIdx = curPlaylist.value.indexOf(textMark) + textMark.length;
            let curPlaylistText = curPlaylist.value.slice(0, textMarkEndIdx);

            curOrderedAudios.forEach((audio, idx, array) => {
                curPlaylistText += (idx + 1) + '. ' + audio.dataset.artist + ' \u2013 ' + audio.dataset.title;
                if (audio.dataset.dub) curPlaylistText += ' (' + audio.dataset.dub + ')';
                if (array[idx + 1]) curPlaylistText += '\n';
            });

            breakLine(curPlaylistText);
        } else {
            curPlaylist.value = 'Playlist cleared';
        }

        // Last removed track
        if (!removingTracksNum) {
            // Save current tracklist
            localStorage.setItem('current_tracklist', JSON.stringify(curTracklist));

            // Change the playlist limiter width to default value
            let hoveredActiveTrackInfoLim = playlist.querySelector('.track-title-limiter.hover') ||
                playlist.querySelector('.artist-name-limiter.hover');
            if (hoveredActiveTrackInfoLim) {
                let hoveredActiveTrackInfo = hoveredActiveTrackInfoLim.firstElementChild;
                adjustPlaylistLimiterWidth(hoveredActiveTrackInfo);
            } else {
                playlistLim.style.width = '';
            }

            // Highlight selected audio
            if (highlightActiveElem || eventType != 'keydown') highlightSelected(selectedAudio);

            // Hide scroll elements after a while and align playlist (bug)
            stopScrolling(KEY_SCROLLING_TIME);

            // Trigger for adding track animation
            document.dispatchEvent(eventRemovingTracksEnd);
        }

        checkPlaylistScrollability();
        checkScrollElemsVisibility();
    });
}

visPlaylistArea.oncontextmenu = function(event) {
    if (!event.target.hasAttribute('data-actionable')) return;

    event.preventDefault();

    //console.log(document.getSelection().toString());

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

    eventManager.addOnceEventListener(downloadLink, 'click', clickDownloadLink);
    document.addEventListener('pointerdown', removeTrackMenu);

    function clickDownloadLink() {
        let loadInfo = audio.parentElement.querySelector('.load-info');
        if (loadInfo) loadInfo.remove();

        downloadAudio(audio);

        trackMenu.remove();
        document.removeEventListener('pointerdown', removeTrackMenu);
    }
    
    function removeTrackMenu(event) {
        if (event.target.closest('.track-menu')) return;

        trackMenu.remove();
        document.removeEventListener('pointerdown', removeTrackMenu);
        eventManager.removeOnceEventListener(downloadLink, 'click', 'clickDownloadLink');
    }

    async function downloadAudio(audio) {
        let trackInfoBox = audio.parentElement.querySelector('.track-info-box');
            
        let loadInfo = document.createElement('div');
        loadInfo.className = 'load-info';
        trackInfoBox.appendChild(loadInfo);

        let progress = document.createElement('div');
        progress.className = 'progress';
        loadInfo.appendChild(progress);

        let status = document.createElement('div');
        status.className = 'status';
        status.innerHTML = 'Waiting for loading...';
        progress.appendChild(status);

        let displayProgress = document.createElement('div');
        displayProgress.className = 'display-progress';
        displayProgress.innerHTML = '0%';
        loadInfo.appendChild(displayProgress);

        let url = audio.dataset.src;
        let response = await fetch(url);
    
        if (response.ok) {
            status.innerHTML = 'Loading...';

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
                progress.style.width = `calc(${receivedPercent}%)`;
                displayProgress.innerHTML = Math.floor(receivedPercent) + '%';
            }

            if (receivedLength === contentLength) status.innerHTML = 'Complete download!';

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

                        status.innerHTML = 'Audio file is saved!';
                        hideLoadStatus();
                        return;
                    } catch (err) {
                        console.error(err.name + ': ' + err.message);

                        if (err.name === 'AbortError') { // Отмена скачивания файла, не предлагать второй вариант
                            status.innerHTML = 'Audio file saving canceled';
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

            status.innerHTML = 'Download failed';
            hideLoadStatus();
        }

        function hideLoadStatus() {
            loadInfo.style.opacity = 0;

            let loadInfoStyle = getComputedStyle(loadInfo);
            let transitionProperties = loadInfoStyle.transitionProperty.split(', ');
            let transitionDurations = loadInfoStyle.transitionDuration.split(', ');
            let opacityIdx = transitionProperties.indexOf('opacity');
            let hideDelay = ~opacityIdx ? parseFloat(transitionDurations[opacityIdx]) * 1000 : 0;

            setTimeout(() => {
                if (trackInfoBox.contains(loadInfo)) loadInfo.remove();
            }, hideDelay);

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

    if (!scrollablePlaylist) return;

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
    let isDocScrollbar = isDocScrollbarCheck();

    if (!accelerateScrolling) return;
    if (!isDocScrollbar) return;
    if (activeElem == visPlaylistArea) return;
    if (activeElem != visPlaylistArea && !activeElem.matches('.tracklist-section') &&
        activeElem.scrollHeight > activeElem.clientHeight) return;
    if (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) return;
    if (pointerModeScrolling) return;

    startScrolling(key);
};

playlistContainer.onpointerleave = () => {
    cursorOverPlaylist = false;

    if (!scrollablePlaylist) return;
    if (pointerModeScrolling) return;

    if (!activeScrollKeys.size) {
        if (!removingTracksNum) hideScrollElems();
    } else {
        let activeElem = document.activeElement;
        if (activeElem == visPlaylistArea) return;

        let isDocScrollbar = isDocScrollbarCheck();
        let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
        let direction = scrollingKeysData[key].direction;
        let isReachingLimits = checkReachingPlaylistBoundaries(direction);
        let isProhibitedActiveElem = 
            (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) ||
            (!activeElem.matches('.tracklist-section') && activeElem.scrollHeight > activeElem.clientHeight)
        ;

        if (isDocScrollbar) {
            if (accelerateScrolling && !isReachingLimits && !isProhibitedActiveElem) {
                stopScrolling(KEY_SCROLLING_TIME);
            } else {
                if (!removingTracksNum) hideScrollElems();
            }
        } else {
            if (isProhibitedActiveElem && !removingTracksNum) hideScrollElems();
        }
    }
};

// Works if document.activeElement = document.body
visPlaylistArea.addEventListener('blur', () => {
    if (!scrollablePlaylist) return;
    if (!accelerateScrolling) return;
    if (cursorOverPlaylist) return;
    if (pointerModeScrolling) return;

    setTimeout(() => {
        let activeElem = document.activeElement;
        let isDocScrollbar = isDocScrollbarCheck();

        if (!isDocScrollbar) return;
        if (activeElem != document.body) return;
        if (visPlaylistArea.classList.contains('focused')) return;
        
        stopScrolling(KEY_SCROLLING_TIME);
    });
});

visPlaylistArea.onwheel = (event) => {
    if (!scrollablePlaylist) return;

    event.preventDefault();
    
    scrollAndAlignPlaylist({
        direction: (event.deltaY > 0) ? 'down' : 'up',
        deltaHeight: trackHeight * wheelScrollStep,
        wheel: true
    });
};

// Pointer Mode Scrolling
visPlaylistArea.onpointerdown = function(event) {
    if (event.pointerType == 'mouse' && event.button != 1) return;
    if (isTouchDevice && !event.isPrimary) return;
    if (!scrollablePlaylist) return;
    if (pointerModeScrolling) return;
    let outOfVisibleArea = event.clientX > this.getBoundingClientRect().right;
    if (outOfVisibleArea) return;
    event.preventDefault();

    document.getSelection().empty();

    this.setPointerCapture(event.pointerId);

    if (event.pointerType == 'mouse') {
        let cursorScrollStyles = '<link rel="stylesheet" href="styles/scrolling-cursors.css" type="text/css">';
        document.querySelector('head').insertAdjacentHTML('beforeend', cursorScrollStyles);
        document.body.classList.add('pointer-scroll-mode');

        eventManager.addOnceEventListener(this, 'pointerup', runPointerModeScrolling);
    } else if (isTouchDevice) {
        eventManager.addOnceEventListener(this, 'pointermove', runPointerModeScrolling);
    }

    function runPointerModeScrolling(event) {
        console.log('pointer mode scrolling on');
    
        pointerModeScrolling = true;

        this.focus({preventScroll: true});
    
        let centerY = event.clientY;
        let currentY = centerY;
        let lastCurrentY = currentY;
        let sensingDistance = 30;
        let direction, deltaHeight;

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
                    if (!activeScrollInPointerMode) {
                        cancelAnimationFrame(requestAligningScroll);
                        activeScrollAndAlign = false;
                        activeScrollInPointerMode = true;
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
            
                    let isReachingLimits = checkReachingPlaylistBoundaries(direction);
    
                    if (isReachingLimits) {
                        activeScrollInPointerMode = false;
                    } else {
                        requestScrollInPointerMode = requestAnimationFrame(scrollInPointerMode);
                    }
                });
            } else { // No scrolling action
                if (
                    !activeScrollOnKeyRepeat &&
                    !direction &&
                    activeScrollInPointerMode &&
                    (Math.abs(lastCurrentY - centerY) >= sensingDistance)
                ) {
                    scrollAndAlignPlaylist({
                        duration: 400 / deltaHeight
                    });
                    
                    activeScrollInPointerMode = false;
                }
            }
    
            lastCurrentY = currentY;
        }
    
        // Cancellation pointerModeScrolling
        cancelPointerModeScrolling = cancelPointerModeScrolling.bind(this);

        if (event.pointerType == 'mouse') {
            eventManager.addOnceEventListener(document, 'pointerdown', cancelPointerModeScrolling);
        } else if (isTouchDevice) {
            eventManager.addOnceEventListener(this, 'pointerup', cancelPointerModeScrolling);
        }
        
        function cancelPointerModeScrolling(event) {
            console.log('pointer mode scrolling off');
            
            if (event.pointerType == 'mouse' && event.button == 1) {
                event.preventDefault();
            }
    
            // Before pointerModeScrolling == false to prevent additional alignment
            if (!event.target.closest('#visible-playlist-area')) {
                this.blur();
            }
    
            pointerModeScrolling = false;
    
            cancelAnimationFrame(requestScrollInPointerMode);
    
            if (!accelerateScrolling) {
                alignPlaylist();
            } else {
                let isDocScrollbar = isDocScrollbarCheck();
    
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
    
            function alignPlaylist() {
                let duration = activeScrollInPointerMode ? (400 / deltaHeight) : 0;
    
                scrollAndAlignPlaylist({
                    duration,
                    hide: true,
                    hideDelay: duration
                });
            }
        }
    }
};

function keepSelectedTitleVisible(audio) {
    if (audio.hasAttribute('data-removed')) return;

    clearTimeout(timerReturnFocusDelay);

    let isScrollAndAlignPlaylistActive = false;

    // Playlist scroll alignment
    if (scrollablePlaylist) {
        let initScrolled = playlistLim.scrollTop;
        let visibleHeight = playlistLim.clientHeight;
        let selTrackPlaylistTop = origOrderedAudios.indexOf(audio) * trackHeight;
        let direction, deltaHeight;

        if (selTrackPlaylistTop < initScrolled) {
            direction = 'up';
            deltaHeight = initScrolled - selTrackPlaylistTop;
        }

        if (selTrackPlaylistTop + trackHeight > initScrolled + visibleHeight) {
            direction = 'down';
            deltaHeight = trackHeight + selTrackPlaylistTop - (initScrolled + visibleHeight);
        }

        if (direction && deltaHeight) { // The track title IS NOT FULL in the visible area of the playlist
            isScrollAndAlignPlaylistActive = true;
            
            showScrollElems();
            scrollAndAlignPlaylist({
                direction,
                deltaHeight,
                align: false,
                hide: true
            });
        } else {
            cancelAnimationFrame(requestAligningScroll);
            activeScrollAndAlign = false;

            if (initScrolled % trackHeight) {
                isScrollAndAlignPlaylistActive = true;

                showScrollElems();
                scrollAndAlignPlaylist({
                    hide: true
                });
            }
        }
    }

    // Window scroll alignment
    eventManager.removeOnceEventListener(document, 'scrollAndAlignPlaylistEnd', 'scrollAndAlignDocument');

    scrollEndStates.curPlaylist = false; // Gotta be close to scrollEndStates.document

    let isPlaylistInView = isPlaylistInViewCheck();
    if (!isPlaylistInView) {
        scrollEndStates.document = false;

        if (isScrollAndAlignPlaylistActive) {
            eventManager.addOnceEventListener(document, 'scrollAndAlignPlaylistEnd', scrollAndAlignDocument);
        } else {
            scrollAndAlignDocument();
        }
    }

    highlightSelected(audio);

    function scrollAndAlignDocument() {
        let track = selectedAudio.parentElement;
        let trackRect = track.getBoundingClientRect();
        let initScrolled = window.scrollY;
        let winHeight = getWinHeight();
        let heightShift = scrollablePlaylist ? playlistScrollArrowBoxHeight : 0;
        let y = initScrolled;
    
        if (trackRect.top < heightShift) {
            y = trackRect.top - heightShift + initScrolled;
            y = Math.floor(y); // For removing arrow box
        } else if (trackRect.bottom > winHeight - heightShift) {
            y = trackRect.bottom + heightShift - winHeight + initScrolled;
            y = Math.ceil(y); // For removing arrow box
        }
    
        window.scrollTo({
            left: (window.targetScrollPosX !== undefined) ? window.targetScrollPosX : window.scrollX,
            top: y,
            behavior: 'smooth'
        });
    
        if (y != initScrolled && hasScrollend) {
            window.targetScrollPosY = y;
            eventManager.addOnceEventListener(document, 'scrollend', () => scrollEndStates.document = true);
        } else {
            scrollEndStates.document = true;
        }
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

            let canPlaylistScrolling = canPlaylistScrollingCheck(key);

            if (canPlaylistScrolling) {
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

    let canPlaylistScrolling = canPlaylistScrollingCheck(key);

    if (canPlaylistScrolling) {
        event.preventDefault();
        startScrolling(key);
    } else {
        if (activeScrollOnKeyRepeat) {stopScrolling(KEY_SCROLLING_TIME);}
        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    }
}

function repeatKeyScrollAction(event) {
    let key = event.code;
    let canPlaylistScrolling = canPlaylistScrollingCheck(key);
    if (canPlaylistScrolling) event.preventDefault();
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

    if (activeScrollKeys.size) {
        let prevKey = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
        let canPlaylistScrolling = canPlaylistScrollingCheck(prevKey);

        if (canPlaylistScrolling) {
            event.preventDefault();
            startScrolling(prevKey);
        } else {
            if (activeScrollOnKeyRepeat) stopScrolling(KEY_SCROLLING_TIME);
        }
    } else { // The last active scroll key has been released
        if (accelerateScrolling) accelerateScrolling = false;

        let canPlaylistScrolling = canPlaylistScrollingCheck(null);
        if (!canPlaylistScrolling) return;

        let direction = scrollingKeysData[key].direction;
        let isReachingLimits = checkReachingPlaylistBoundaries(direction);

        if (
            isReachingLimits &&
            !cursorOverPlaylist &&
            !pointerModeScrolling &&
            !playlist.hasAttribute('adding-tracks')
        ) {
            hideScrollElems();
        }

        if (activeScrollOnKeyRepeat && !activeScrollInPointerMode && !isReachingLimits) {
            stopScrolling(HIDE_SCROLL_ELEMENTS_DELAY);
        }
    }
}

function canPlaylistScrollingCheck(key) {
    let activeElem = document.activeElement;

    if (!scrollablePlaylist) return false;
    if (activeElem != visPlaylistArea && !activeElem.matches('.tracklist-section') &&
        activeElem.scrollHeight > activeElem.clientHeight) return false;
    if (activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) return false;

    let isDocScrollbar = isDocScrollbarCheck();

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
        scrollAndAlignPlaylist({
            direction: scrollingKeysData[key].direction,
            deltaHeight: scrollingKeysData[key].deltaHeight(),
            duration: KEY_SCROLLING_TIME,
            align: (key == 'Home' || key == 'End') ? false : true,
            hide: true
        });
    } else {
        requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
    }
}

function stopScrolling(hideDelay) {
    if (!scrollablePlaylist) return;

    scrollAndAlignPlaylist({
        duration: KEY_SCROLLING_TIME,
        hide: true,
        hideDelay
    });
}

function stopScrollingAndClean() {
    if (!activeScrollKeys.size) return;

    stopScrolling(KEY_SCROLLING_TIME);

    activeScrollKeys.clear();
    accelerateScrolling = false;

    if (timerAccelerateScrolling) {
        clearTimeout(timerAccelerateScrolling);
        timerAccelerateScrolling = null;
    }
}

function scrollOnKeyRepeat() {
    if (!activeScrollKeys.size) return;
    if (!accelerateScrolling) return;

    cancelAnimationFrame(requestAligningScroll);
    activeScrollAndAlign = false;
    cancelAnimationFrame(requestScrollOnKeyRepeat);

    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let direction = scrollingKeysData[key].direction;
    let isReachingLimits = checkReachingPlaylistBoundaries(direction);
    if (isReachingLimits && !playlist.hasAttribute('adding-tracks')) {
        finalizeScrolling();
        return;
    }

    activeScrollOnKeyRepeat = true;

    activateScrollArrows();

    let deltaHeight = (key == 'Home' || key == 'End') ?
        playlistLim.scrollHeight / 10 :
        scrollingKeysData[key].factor * 10;

    playlistLim.scrollTop += (direction == 'down') ? deltaHeight : ((direction == 'up') ? -deltaHeight : 0);

    isReachingLimits = checkReachingPlaylistBoundaries(direction);
    if (isReachingLimits && !playlist.hasAttribute('adding-tracks')) {
        finalizeScrolling();
        return;
    }

    function finalizeScrolling() {
        activeScrollOnKeyRepeat = false;
        document.dispatchEvent(eventScrollAndAlignPlaylistEnd);
        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    }

    requestScrollOnKeyRepeat = requestAnimationFrame(scrollOnKeyRepeat);
}

function scrollAndAlignPlaylist(options) {
    options = Object.assign(
        {
            direction: playlistLimScrollDirection,
            deltaHeight: 0,
            duration: DEFAULT_SCROLLING_TIME,
            wheel: false,
            align: true,
            hide: false,
            hideDelay: HIDE_SCROLL_ELEMENTS_DELAY
        },
        options
    );

    let {direction, deltaHeight, duration, wheel, align, hide, hideDelay} = options;

    if (
        hide &&
        scrollElemsDisplaying &&
        !cursorOverPlaylist &&
        !pointerModeScrolling
    ) {
        clearTimeout(timerHideScrollElems);

        timerHideScrollElems = setTimeout(() => {
            let activeElem = document.activeElement;
            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            let isDocScrollbar = isDocScrollbarCheck();

            if (cursorOverPlaylist) return;
            if (pointerModeScrolling) return;
            if (removingTracksNum) return;
            if (
                !isDocScrollbar &&
                activeScrollKeys.size &&
                activeElem.scrollHeight <= activeElem.clientHeight &&
                !(activeElem.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown'))
            ) return;

            hideScrollElems();
        }, hideDelay);
    }
    
    cancelAnimationFrame(requestAligningScroll);
    activeScrollAndAlign = false;
    cancelAnimationFrame(requestScrollOnKeyRepeat);
    activeScrollOnKeyRepeat = false;

    let isReachingLimits = checkReachingPlaylistBoundaries(direction);
    if (isReachingLimits) return;

    let initScrolled = playlistLim.scrollTop;
    let remainder = initScrolled % trackHeight;
    if (!deltaHeight && !remainder) return;

    activeScrollAndAlign = true;

    activateScrollArrows();
    
    let remainderRatio = remainder / trackHeight;

    if (remainderRatio && align) {
        let k = wheel ? 1 : 0;

        if (direction == 'down') {
            deltaHeight += trackHeight * (k + 1 - remainderRatio);
        }
        if (direction == 'up') {
            deltaHeight += trackHeight * (k + remainderRatio);
        }
    }

    let startTime = performance.now();
    
    requestAligningScroll = requestAnimationFrame(function aligningScroll(time) {
        let timeFraction = (time - startTime) / duration;
        if (timeFraction < 0) {
            requestAligningScroll = requestAnimationFrame(aligningScroll);
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

        let isReachingLimits = checkReachingPlaylistBoundaries(direction);

        if (isReachingLimits) {
            endScrollAndAlign();
        } else {
            if (timeFraction < 1) {
                requestAligningScroll = requestAnimationFrame(aligningScroll);
            } else {
                endScrollAndAlign();
            }
        }

        function endScrollAndAlign() {
            activeScrollAndAlign = false;
            document.dispatchEvent(eventScrollAndAlignPlaylistEnd);

            // If the scroll keys are pressed after the wheel or Tab focus has completed scrolling
            if (accelerateScrolling) {
                let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
                let canPlaylistScrolling = canPlaylistScrollingCheck(key);
                if (canPlaylistScrolling) startScrolling(key);
            }
        }
    });
}

function checkReachingPlaylistBoundaries(direction) {
    let boundaryReached = '';

    if (playlistLim.scrollTop == 0) {
        playlistScrollArrowUp.classList.add('inactive');
        boundaryReached = 'up';
    }
    if (playlistLim.scrollHeight - playlistLim.scrollTop == playlistLim.clientHeight) {
        playlistScrollArrowDown.classList.add('inactive');
        boundaryReached = 'down';
    }

    return (direction === boundaryReached) ? true : false;
}

function activateScrollArrows() {
    playlistScrollArrowUp.classList.remove('inactive');
    playlistScrollArrowDown.classList.remove('inactive');
}

function showScrollElems() {
    clearTimeout(timerHideScrollElems);

    scrollElemsDisplaying = true;

    playlistScrollArrowUp.hidden = false;
    playlistScrollArrowDown.hidden = false;
}

function hideScrollElems() {
    clearTimeout(timerHideScrollElems);

    scrollElemsDisplaying = false;

    playlistScrollArrowUp.hidden = true;
    playlistScrollArrowDown.hidden = true;
}

function checkPlaylistScrollability() {
    if (playlistLim.scrollHeight > playlistLim.clientHeight) {
        if (scrollablePlaylist) return;

        scrollablePlaylist = true;
        playlistContainer.classList.add('scrollable');

        activateScrollArrows();
        checkReachingPlaylistBoundaries('all');
        if (cursorOverPlaylist || pointerModeScrolling) showScrollElems();
    } else {
        if (!scrollablePlaylist) return;

        scrollablePlaylist = false;
        playlistContainer.classList.remove('scrollable');

        checkReachingPlaylistBoundaries('all');

        timerHideScrollElems = setTimeout(hideScrollElems, HIDE_SCROLL_ELEMENTS_DELAY);
    }
}

//////////////////
// Track titles //
//////////////////

function showLoading(audio) {
    let track = audio.closest('.track');
    track.classList.add('no-color-transition');
    track.classList.add('loading');
    indicator.classList.remove('active');
}
function hideLoading(audio) {
    let track = audio.closest('.track');
    track.classList.remove('loading');
    track.offsetWidth; // Causes reflow
    track.classList.remove('no-color-transition');
}

function setSelected(audio) {
    let track = audio.closest('.track');
    track.classList.add('selected');
    checkAnimatedTransition(track);
}
function removeSelected(audio) {
    let track = audio.closest('.track');
    track.classList.remove('selected');
    checkAnimatedTransition(track);
}

function checkAnimatedTransition(track) {
    if (playlistStyle === 'smooth') {
        let artistName = track.querySelector('.artist-name');
        let trackTitle = track.querySelector('.track-title');

        for (let activeTrackInfo of [artistName, trackTitle]) {
            let activeTrackInfoLim = activeTrackInfo.parentElement;

            activeTrackInfoLim.setAttribute('data-animating', '');
    
            eventManager.addOnceEventListener(activeTrackInfoLim, 'transitionend', () => {
                activeTrackInfoLim.removeAttribute('data-animating');
            });
    
            if (activeTrackInfo.matches(':hover')) {
                adjustPlaylistLimiterWidth(activeTrackInfo);
            }
        }
    }
}

///////////////////////////
// Player footer buttons //
///////////////////////////

configBtn.onclick = (event) => {
    changeConfig.eventType = event.type;
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

keysInfoBtn.onclick = showKeysInfo;

///////////////////////////////////////////////
// Side button (tracklist databse show/hide) //
///////////////////////////////////////////////

function calcTracklistDtbsBtnPosition() {
    const minTracklistDtbsBtnHeight = 50;
    let tracklistDtbsBtnHeight = defTracklistDtbsBtnHeight;
    let winHeight = getWinHeight();
    let playerRect = player.getBoundingClientRect();
    let playerScrolled = (playerRect.top < 0) ? Math.abs(playerRect.top) : 0;
    let playerTop = Math.max(playerRect.top, 0);
    let playerBottom = (playerRect.bottom > winHeight) ? winHeight : playerRect.bottom;
    let visPlayerHeight = playerBottom - playerTop;

    if (tracklistDtbsBtnHeight > visPlayerHeight - commonBorderRadius * 2) {
        tracklistDtbsBtnHeight = visPlayerHeight - commonBorderRadius * 2;

        if (tracklistDtbsBtnHeight < minTracklistDtbsBtnHeight) {
            tracklistDtbsBtnHeight = minTracklistDtbsBtnHeight;

            if (visPlayerHeight < minTracklistDtbsBtnHeight + commonBorderRadius * 2) {
                let tracklistDtbsBtnTop = player.offsetHeight - tracklistDtbsBtnHeight - commonBorderRadius;
                tracklistDtbsBtnCont.style.top = tracklistDtbsBtnTop + 'px';
            }
        } else {
            tracklistDtbsBtnCont.style.top = playerScrolled + commonBorderRadius + 'px';
        }

        tracklistDtbsBtnCont.style.height = tracklistDtbsBtnHeight + 'px';
    } else {
        let tracklistDtbsBtnTop = playerScrolled + visPlayerHeight / 2 - tracklistDtbsBtnHeight / 2;
        tracklistDtbsBtnCont.style.top = tracklistDtbsBtnTop + 'px';
        tracklistDtbsBtnCont.style.height = '';
    }
}

tracklistDtbsBtn.onclick = tracklistDatabaseAction;

function tracklistDatabaseAction() {
    let playerMoveInfo;

    if (
        tracklistDatabase.hasAttribute('data-resizing') ||
        settingsArea.hasAttribute('data-await-run-hide-settings') ||
        settingsArea.hasAttribute('data-waiting-action') ||
        tracklistsContainer.hasAttribute('data-toggle-tracklist-details') ||
        (
            playerMoveInfo = JSON.parse(player.getAttribute('data-move-info')),
            playerMoveInfo && playerMoveInfo.moving && playerMoveInfo.trigger === 'settingsArea'
        )
    ) {
        tracklistDatabase.setAttribute('data-waiting-action', '');
        return;
    }

    let isTracklistDtbsStickedLeft = tracklistDatabase.classList.contains('sticked-left');
    let isTracklistDtbsMoved = tracklistDatabase.hasAttribute('data-moving');
    let playerLeft = player.getBoundingClientRect().left + window.scrollX;

    resetTracklistDtbsAndPlayerStates();
    scrollDoc('left', 'smooth');

    tracklistDtbsBtn.classList.remove('enabled');

    if (tracklistDtbsBtn.classList.contains('waiting')) {
        runTracklistDatabaseAction();
    } else {
        tracklistDtbsBtn.classList.add('waiting');
        requestAnimationFrame(() => setTimeout(runTracklistDatabaseAction));
    }

    function runTracklistDatabaseAction() {
        if (!tracklistDatabase.classList.contains('enabled')) { // Move/show tracklists
            tracklistDatabase.classList.add('enabled');

            checkGlobalStates();
            calcTracklistsTextIndent();
            disableTracklistsContainerScroll();
            //calcTracklistsContainerMaxHeight();
            calcTracklistsContainerMaxHeight();
            checkPlayerContainertJustify();
    
            let tracklistDtbsLeft = playerLeft - tracklistDatabase.offsetWidth;
            let noSpaceForMoving = (tracklistDtbsLeft === 0) ? true : false;
    
            if (isTracklistDtbsStickedLeft && !noSpaceForMoving) { // Move tracklists
                moveTracklistDatabase();
            } else { // Show tracklists
                toggleTracklistDtbsAnimation('show');
            }
        } else { // Hide tracklists/move player
            if (tracklistDatabase.classList.contains('active')) { // Hide tracklists
                disableTracklistsContainerScroll();
                toggleTracklistDtbsAnimation('hide');
            } else {
                if (isTracklistDtbsMoved) { // Cancel tracklists moving animation (move player)
                    movePlayer();
                } else { // Cancel tracklists hiding animation (show tracklists)
                    toggleTracklistDtbsAnimation('show');
                }
            }
        }
    }
            
    function moveTracklistDatabase() {
        tracklistDatabase.setAttribute('data-moving', '');

        let curTracklistDtbsWidth = tracklistDatabase.offsetWidth;
        let tracklistDtbsLeft = playerLeft - curTracklistDtbsWidth;

        tracklistDatabase.style.width = curTracklistDtbsWidth + 'px'; 
        tracklistDatabase.style.marginLeft = tracklistDtbsLeft + 'px';
        tracklistDatabase.offsetWidth; // Causes a reflow
        tracklistDatabase.classList.add('smooth-moving');
        setTimeout(() => tracklistDatabase.style.marginLeft = '');

        eventManager.addOnceEventListener(tracklistDatabase, 'transitionend', endSmoothMoving);
    }

    function movePlayer() {
        player.setAttribute('data-move-info', '{"moving": true, "trigger": "tracklistDatabase"}');

        tracklistDatabase.classList.remove('enabled');

        playerContainer.style.minHeight = '';
        setDocScrollbarYWidth();

        player.style.marginLeft = playerLeft + 'px';
        player.offsetWidth; // Causes a reflow
        player.classList.add('smooth-moving');
        player.style.marginLeft = (canAutoChangeWidth && !settingsArea.hidden) ? 0 : '';

        eventManager.addOnceEventListener(player, 'transitionend', endSmoothMoving);
    }

    function endSmoothMoving() {
        resetTracklistDtbsAndPlayerStates();
        checkGlobalStates();

        if (tracklistDatabase.classList.contains('enabled')) { // Tracklists ends moving => Show tracklists
            tracklistDatabase.removeAttribute('data-moving');

            scrollDoc('left', 'smooth');
            checkPendingSettingsAction();
            toggleTracklistDtbsAnimation('show');
        } else { // Player ends moving => End animations
            tracklistDtbsBtn.classList.remove('waiting');
            tracklistDtbsBtn.classList.remove('enabled');

            let isDocScrolling = (!settingsArea.hidden && settingsArea.dataset.waitingAction !== 'hideSettings') ?
                scrollDoc('right', 'smooth') :
                false;

            if (isDocScrolling) {
                eventManager.addOnceEventListener(document, 'scrollend', checkPendingSettingsAction);
            } else {
                checkPendingSettingsAction();
            }

            checkStartInfoDisplaying();
        }
    }

    function checkPendingSettingsAction() {
        let actionFunc = settingsArea.dataset.waitingAction;
    
        if (actionFunc) {
            settingsArea.removeAttribute('data-waiting-action');
            settingsArea.setAttribute('data-running-action', '');
    
            setTimeout(window[actionFunc]);
        } else {
            checkPlayerContainertJustify();
        }
    }

    function resetTracklistDtbsAndPlayerStates() {
        tracklistDatabase.removeAttribute('data-moving');
        player.removeAttribute('data-move-info');

        tracklistDatabase.style.width = '';
        tracklistDatabase.style.marginLeft = '';
        player.style.marginLeft = '';

        tracklistDatabase.classList.remove('smooth-moving');
        player.classList.remove('smooth-moving');

        eventManager.removeOnceEventListener(tracklistDatabase, 'transitionend', 'endSmoothMoving');
        eventManager.removeOnceEventListener(player, 'transitionend', 'endSmoothMoving');
        [tracklistDtbsTitle, tracklistDtbsAddControls.lastElementChild].forEach(elem => {
            eventManager.clearEventHandlers(elem, 'transitionstart');
            eventManager.clearEventHandlers(elem, 'transitionend');
        });
        if (hasScrollend) eventManager.removeOnceEventListener(document, 'scrollend', 'checkPendingSettingsAction');
    }

    function toggleTracklistDtbsAnimation(animationAction) {
        tracklistDatabase.classList.toggle('active', animationAction === 'show');
        
        let visTracklistSections = filterVisibleTracklistSections();
        let addControlsBtns = Array.from(tracklistDtbsAddControls.children);
        let animatedElems = [].concat(tracklistDtbsTitle, visTracklistSections, addControlsBtns);
        if (animationAction === 'hide') animatedElems.reverse();
        let animElemsNum = animatedElems.length;
        let controlsNum = tracklistDtbsAddControls.children.length;
        let endAnimFunc = (animationAction === 'show') ? endShowAnimation : endHideAnimation;
        let args = [animatedElems, animElemsNum, controlsNum, animationAction, endAnimFunc];

        animateElements(...args);
    }

    async function animateElements(animatedElems, animElemsNum, controlsNum, animationAction, endAnimFunc) {
        let firstIteration = true;

        for (let i = 0; i < animElemsNum; i++) {
            if (i == 0 && !tracklistDatabase.hasAttribute('data-animating')) {
                setAnimationStart(animatedElems[i]);
            }

            if (i == animElemsNum - 1) {
                if (tracklistDatabase.hasAttribute('data-animating')) {
                    setAnimationEnd(animatedElems[i], endAnimFunc, animationAction);
                } else {
                    endAnimFunc(animationAction);
                }
            }

            if (animatedElems[i].classList.contains('show') === (animationAction === 'show')) continue;

            let timeDelay = getAnimationDelay(animationAction, i, animElemsNum, controlsNum, firstIteration);
            let promiseDelay = await promiseAnimation(timeDelay, animatedElems[i], animationAction);
            if (!promiseDelay) return;

            firstIteration = false;
        }

        function getAnimationDelay(animationAction, i, n, m, k) {
            if (animationAction === 'show') {
                return (i == 0 || k) ? 0 : (i == n - m) ? 250 : (i == 1) ? 200 : 100;
            } else {
                return (i == 0 || k) ? 0 : (i == n - 1) ? 200 : (i == m) ? 250 : 100;
            }
        }
    }

    function promiseAnimation(timeDelay, elem, animationAction) {
        return new Promise((resolve, reject) => {
            if (!timeDelay) {
                runChecking();
            } else {
                setTimeout(runChecking, timeDelay);
            }

            function runChecking() {
                let isChecking = toggleShowClass(elem, animationAction);

                if (isChecking) resolve()
                else reject();
            }
        }).then(
            () => true,
            () => false
        );
    }

    function filterVisibleTracklistSections() {
        return [].filter.call(tracklistsContainer.children, (section) => {
            let trlContainerTop = tracklistsContainer.scrollTop;
            let trlContainerBottom = trlContainerTop + tracklistsContainer.clientHeight;

            let sectionTop = section.offsetTop;
            let sectionBottom = sectionTop + section.offsetHeight;

            let isSectionTopVisible = sectionTop > trlContainerTop && sectionTop < trlContainerBottom;
            let isSectionBottomVisible = sectionBottom > trlContainerTop && sectionBottom < trlContainerBottom;

            return isSectionTopVisible || isSectionBottomVisible;
        });
    }

    function toggleShowClass(elem, animationAction) {
        let isActive = tracklistDatabase.classList.contains('active');

        if (isActive && animationAction === 'show') {
            elem.classList.add('show');
            return true;
        } else if (!isActive && animationAction === 'hide') {
            elem.classList.remove('show');
            return true;
        }

        return false;
    }

    async function toggleShowClassWithoutAnimation(animationAction) {
        let totalTracklists = tracklistsContainer.children.length;

        return !totalTracklists ? true : await new Promise((resolve, reject) => {
            tracklistDatabase.setAttribute('data-optimizing', '');

            let startActiveState = tracklistDatabase.classList.contains('active');
            let batchSize = 25;
            let i = 0;

            disableTransitionAnimations();
            optimizeClassChange();
    
            function optimizeClassChange() {
                if (i < totalTracklists - batchSize) {
                    setTimeout(() => {
                        let curActiveState = tracklistDatabase.classList.contains('active');
    
                        if (curActiveState == startActiveState) {
                            optimizeClassChange();
                        } else {
                            tracklistDatabase.removeAttribute('data-optimizing');
                            enableTransitionAnimations();
                            reject();
                        }
                    });
                }

                do {
                    toggleShowClass(tracklistsContainer.children[i++], animationAction);
                } while (i % batchSize != 0 && i < totalTracklists);
    
                if (i >= totalTracklists) {
                    tracklistDatabase.removeAttribute('data-optimizing');
                    enableTransitionAnimations();
                    resolve();
                }
            }

            function disableTransitionAnimations() {
                tracklistsContainer.classList.add('no-animation');
                tracklistsContainer.offsetHeight; // Causes a reflow 
            }

            function enableTransitionAnimations() {
                tracklistsContainer.offsetHeight; // Causes a reflow
                tracklistsContainer.classList.remove('no-animation');
            }
        }).then(
            () => true,
            () => false
        );
    }

    function setAnimationStart(elem) {
        eventManager.addOnceEventListener(elem, 'transitionstart', () => {
            tracklistDatabase.setAttribute('data-animating', '');
            tracklistDatabase.style.pointerEvents = 'none';
        });
    }

    function setAnimationEnd(elem, func, animationAction) {
        eventManager.addOnceEventListener(elem, 'transitionend', () => {
            tracklistDatabase.removeAttribute('data-animating');
            tracklistDatabase.style.pointerEvents = '';
            func(animationAction);
        });
    }

    async function endShowAnimation(animationAction) {
        let isFinished = await toggleShowClassWithoutAnimation(animationAction);
        if (!isFinished) return;

        tracklistDtbsBtn.classList.remove('waiting');
        tracklistDtbsBtn.classList.add('enabled');

        enableTracklistsContainerScroll();
        checkPendingSettingsAction();
        checkStartInfoDisplaying();
    }

    async function endHideAnimation(animationAction) {
        let isFinished = await toggleShowClassWithoutAnimation(animationAction);
        if (!isFinished) return;

        if (tracklistDatabase.offsetHeight > player.offsetHeight && window.scrollY) {
            window.scrollTo({
                left: window.scrollX,
                top: 0,
                behavior: 'smooth'
            });

            eventManager.addOnceEventListener(document, 'scrollend', runEndHideAnimation);
        } else {
            runEndHideAnimation();
        }

        function runEndHideAnimation() {
            if (isTracklistDtbsStickedLeft) {
                movePlayer();
            } else {
                tracklistDatabase.classList.remove('enabled');

                tracklistDtbsBtn.classList.remove('waiting');
                tracklistDtbsBtn.classList.remove('enabled');

                playerContainer.style.minHeight = '';
                checkGlobalStates();
                checkStartInfoDisplaying();
            }
        }
    }

    function disableTracklistsContainerScroll() {
        tracklistsContainer.style.paddingRight = '';

        if (tracklistsContainer.classList.contains('scrollable')) {
            tracklistsContainer.style.overflow = 'hidden';

            if (!canAutoChangeWidth) {
                let curPaddingRight = parseInt(getComputedStyle(tracklistsContainer).paddingRight);
                tracklistsContainer.style.paddingRight = curPaddingRight + scrollbarWidth + 'px';
            }
        }
    }
    
    function enableTracklistsContainerScroll() {
        tracklistsContainer.style.overflow = '';
        tracklistsContainer.style.paddingRight = '';
    }

    function checkGlobalStates() {
        setDocScrollbarYWidth();
        checkScrollElemsVisibility();
        calcTracklistDtbsBtnPosition();
    }

    function checkStartInfoDisplaying() {
        if (!startInfoDisplay.hasAttribute('data-displayed')) {
            tracklistDatabase.dispatchEvent(eventTracklistDtbsAnimationEnd);
        }
    }
}

//////////////
// Settings //
//////////////

settingsArea.onclick = (event) => {
    if (event.target.closest('.close-button')) hideSettings();
    if (event.target.closest('.default-settings')) resetSettings();
};

window.showSettings = showSettings;
window.hideSettings = hideSettings;

function settingsAction() {
    if (!settingsArea.hasAttribute('data-enabled')) {
        showSettings();
    } else {
        hideSettings();
    }
}

function showSettings() {
    settingsArea.setAttribute('data-enabled', '');
    settingsArea.removeAttribute('data-await-run-hide-settings');

    eventManager.clearEventHandlers(player, 'transitionend');
    if (hasScrollend) eventManager.removeOnceEventListener(document, 'scrollend', 'runHideSettings');

    if (tracklistDatabase.classList.contains('sticked-left')) {
        if ((
                tracklistDatabase.hasAttribute('data-animating') || // Tracklists are showing/hiding
                tracklistDatabase.hasAttribute('data-moving') || // Tracklists are moving
                tracklistDatabase.hasAttribute('data-optimizing')
            ) &&
            !settingsArea.hasAttribute('data-running-action') // No running pending action
        ) {
            settingsArea.setAttribute('data-waiting-action', 'showSettings');
            settingsArea.removeAttribute('data-enabled'); // No switching during tracklist animations
        } else if (
            tracklistDatabase.classList.contains('active')
        ) {
            animateReducingTracklistDtbsWidth();
        } else {
            let playerMoveInfo;

            if (
                playerContainer.dataset.windowWidth === 'below-justify-right-min' ||
                playerContainer.dataset.windowWidth === 'between-justify-right-min-max' ||
                (
                    playerMoveInfo = JSON.parse(player.getAttribute('data-move-info')),
                    playerMoveInfo && playerMoveInfo.moving
                )
            ) {
                animateMovingPlayer();
            } else {
                runShowSettings();
            }
        }
    } else {
        runShowSettings();
    }

    function animateReducingTracklistDtbsWidth() {
        let docWidth = getDocWidth();
        let playerRight = player.getBoundingClientRect().right + window.scrollX;
        let restDocWidth = docWidth - playerRight;
        let requiredDocWidth = settingsAreaWidth;
        let curTracklistDtbsWidth = tracklistDatabase.offsetWidth;
    
        if (
            requiredDocWidth > restDocWidth &&
            curTracklistDtbsWidth > minTracklistDtbsWidth
        ) {
            tracklistDatabase.setAttribute('data-resizing', '');
    
            tracklistDatabase.style.width = curTracklistDtbsWidth + 'px';
            tracklistDatabase.offsetWidth; // Causes a reflow
    
            let newTracklistDtbsWidth = curTracklistDtbsWidth - (requiredDocWidth - restDocWidth);
            if (newTracklistDtbsWidth < minTracklistDtbsWidth) newTracklistDtbsWidth = minTracklistDtbsWidth;
    
            tracklistDatabase.classList.add('smooth-resize');
            tracklistDatabase.style.width = newTracklistDtbsWidth + 'px';
    
            eventManager.removeOnceEventListener(tracklistDatabase, 'transitionend', 'endIncreasingTracklistDtbsWidth');
            eventManager.addOnceEventListener(tracklistDatabase, 'transitionend', endReducingTracklistDtbsWidth);

            function endReducingTracklistDtbsWidth(event) {
                tracklistDatabase.removeAttribute('data-resizing');
                tracklistDatabase.classList.remove('smooth-resize');
                event.target.style.width = '';
   
                runShowSettings();
                checkTracklistDtbsAction();
            }
        } else {
            runShowSettings();
            checkTracklistDtbsAction();
        }
    }

    function animateMovingPlayer() {
        player.setAttribute('data-move-info', '{"moving": true, "trigger": "settingsArea"}');
        player.classList.add('smooth-moving');

        if (playerContainer.dataset.windowWidth !== 'above-justify-right-max') {
            let winWidth = getWinWidth();
            let minWinWidth = player.offsetWidth + settingsAreaWidth;
            let transitionEndPoint = winWidth - minWinWidth;
            player.style.marginLeft = transitionEndPoint + 'px';
        } else {
            player.style.marginLeft = '';
        }

        eventManager.addOnceEventListener(player, 'transitionend', function() {
            player.removeAttribute('data-move-info');
            player.classList.remove('smooth-moving');
            player.style.marginLeft = '';

            runShowSettings();
            checkTracklistDtbsAction();
        });
    }

    function runShowSettings() {
        settingsArea.hidden = false;

        if (!settingsArea.hasAttribute('data-running-action')) {
            settingsArea.removeAttribute('data-waiting-action');

            if (!tracklistDatabase.hasAttribute('data-animating')) {
                tracklistDtbsBtn.classList.remove('waiting');
            }
        } else {
            settingsArea.removeAttribute('data-running-action');
        }

        settingsArea.parentElement.classList.add('justify-space-between');

        calcTracklistsContainerMaxHeight();
        setDocScrollbarYWidth();
        checkPlayerContainertJustify();
        checkScrollElemsVisibility();
        calcTracklistDtbsBtnPosition();
        scrollDoc('right', 'smooth');

        settingsArea.classList.add('active');

        if (selectedAudio) {
            highlightSelected(selectedAudio);
        } else { // If stop playback while the settings area is hidden,
            //the scroll position and text selection will not be reset
            let activeElem = document.activeElement;
            
            curPlaylist.select();
            curPlaylist.setSelectionRange(0, 0);
            if (curPlaylist != activeElem) curPlaylist.blur();

            curPlaylist.scrollTo({
                left: 0,
                top: 0,
                behavior: 'smooth'
            });

            activeElem.focus();
        }
    }
}

function hideSettings() {
    settingsArea.removeAttribute('data-enabled');
    settingsArea.setAttribute('data-await-run-hide-settings', '');
    settingsArea.classList.remove('active');

    eventManager.clearEventHandlers(player, 'transitionend');

    if (highlightActiveElem) {
        if (highlightActiveElem.closest('#settings-area')) {
            cancelReturningFocus();
        } else {
            scrollEndStates.curPlaylist = true;
        }
    }

    let isDocScrolling = scrollDoc('left', 'smooth');

    if (isDocScrolling && hasScrollend) { // Hide settings after scroll ended
        requestAnimationFrame(() => eventManager.addOnceEventListener(document, 'scrollend', runHideSettings));
    } else if (!settingsArea.hidden) { // Hide settings after opasity == 0
        promiseChange(settingsArea, 'transition', 'opacity', settingsBtn, 'KeyF', runHideSettings);
    } else {
        runHideSettings();
    }

    function runHideSettings() {
        settingsArea.removeAttribute('data-await-run-hide-settings');

        if (tracklistDatabase.classList.contains('sticked-left')) {
            if (
                (
                    tracklistDatabase.hasAttribute('data-animating') || // Tracklists are showing/hiding
                    tracklistDatabase.hasAttribute('data-moving') || // Tracklists are moving
                    tracklistDatabase.hasAttribute('data-optimizing')
                ) &&
                !settingsArea.hasAttribute('data-running-action')// No running pending action
            ) {
                settingsArea.setAttribute('data-waiting-action', 'hideSettings');
                settingsArea.setAttribute('data-enabled', ''); // No switching during tracklist animations
            } else if (
                tracklistDatabase.classList.contains('active')
            ) {
                animateIncreasingTracklistDtbsWidth();
            } else {
                let playerMoveInfo;

                if (
                    (
                        playerContainer.dataset.windowWidth === 'between-justify-right-min-max' ||
                        (
                            playerMoveInfo = JSON.parse(player.getAttribute('data-move-info')),
                            playerMoveInfo && playerMoveInfo.moving
                        )
                    ) &&
                    !settingsArea.hasAttribute('data-running-action')
                ) {
                    animateMovingPlayer();
                } else {
                    endHideSettings();
                    checkTracklistDtbsAction();
                }
            }
        } else {
            endHideSettings();
            checkTracklistDtbsAction();
        }
    
        function animateIncreasingTracklistDtbsWidth() {
            let curTracklistDtbsWidth = tracklistDatabase.offsetWidth;
            tracklistDatabase.style.width = curTracklistDtbsWidth + 'px';
            
            endHideSettings();
    
            let docWidth = getDocWidth();
            let requiredDocWidth = minTracklistDtbsWidth + player.offsetWidth +
                docScrollArrowsContainer.offsetWidth;
        
            if (
                docWidth > requiredDocWidth &&
                curTracklistDtbsWidth < maxTracklistDtbsWidth
            ) {
                tracklistDatabase.setAttribute('data-resizing', '');
        
                let newTracklistDtbsWidth = curTracklistDtbsWidth + docWidth - requiredDocWidth;
                if (newTracklistDtbsWidth > maxTracklistDtbsWidth) newTracklistDtbsWidth = maxTracklistDtbsWidth;
        
                tracklistDatabase.classList.add('smooth-resize');
                tracklistDatabase.style.width = newTracklistDtbsWidth + 'px';

                eventManager.removeOnceEventListener(tracklistDatabase, 'transitionend',
                    'endReducingTracklistDtbsWidth');
                eventManager.addOnceEventListener(tracklistDatabase, 'transitionend',
                    endIncreasingTracklistDtbsWidth);

                function endIncreasingTracklistDtbsWidth(event) {
                    tracklistDatabase.removeAttribute('data-resizing');
                    tracklistDatabase.classList.remove('smooth-resize');
                    event.target.style.width = '';
    
                    checkGlobalStates();
                    checkTracklistDtbsAction();
                }
            } else {
                tracklistDatabase.style.width = '';
                checkGlobalStates();
                checkTracklistDtbsAction();
            }
        }
    
        function animateMovingPlayer() {
            player.setAttribute('data-move-info', '{"moving": true, "trigger": "settingsArea"}');

            if (!settingsArea.hidden) {
                let playerLeft = player.getBoundingClientRect().left + window.scrollX;

                endHideSettings();
    
                player.classList.remove('smooth-moving');
                player.style.marginLeft = playerLeft + 'px';
                player.offsetWidth; // Causes a reflow
                player.classList.add('smooth-moving');
            } else {
                checkGlobalStates();
            }
            
            player.style.marginLeft = '';

            eventManager.addOnceEventListener(player, 'transitionend', function() {
                player.removeAttribute('data-move-info');
                player.classList.remove('smooth-moving');

                checkTracklistDtbsAction();
            });
        }
    
        function endHideSettings() {
            settingsArea.hidden = true;

            if (!settingsArea.hasAttribute('data-running-action')) {
                settingsArea.removeAttribute('data-waiting-action');

                if (!tracklistDatabase.hasAttribute('data-animating')) {
                    tracklistDtbsBtn.classList.remove('waiting');
                }
            } else {
                settingsArea.removeAttribute('data-running-action');
            }

            settingsArea.parentElement.classList.remove('justify-space-between');
    
            checkGlobalStates();
        }
    }
    
    function checkGlobalStates() {
        calcTracklistsContainerMaxHeight();
        setDocScrollbarYWidth();
        checkPlayerContainertJustify(); // Causes a reflow
        checkScrollElemsVisibility();
        calcTracklistDtbsBtnPosition();
    }
}

function checkTracklistDtbsAction() {
    if (!tracklistDatabase.hasAttribute('data-waiting-action')) return;

    tracklistDatabase.removeAttribute('data-waiting-action');
    tracklistDatabaseAction();
}

function checkPlayerContainertJustify() {
    let winWidth = getWinWidth();
    let isDocScrollbar = isDocScrollbarCheck();
    let curScrollbarYWidth = isDocScrollbar ? scrollbarWidth : 0;
    let maxWinWidthForSettings = settingsAreaWidth * 2 + player.offsetWidth + curScrollbarYWidth;
    let minWinWidthForSettings = player.offsetWidth + settingsAreaWidth;

    if (winWidth < minWinWidthForSettings) {
        playerContainer.setAttribute('data-window-width', 'below-justify-right-min');
    } else if (winWidth >= minWinWidthForSettings && winWidth <= maxWinWidthForSettings) {
        playerContainer.setAttribute('data-window-width', 'between-justify-right-min-max');
    } else if (winWidth > maxWinWidthForSettings) {
        playerContainer.setAttribute('data-window-width', 'above-justify-right-max');
    }

    if (
        playerContainer.dataset.windowWidth === 'between-justify-right-min-max' &&
        !settingsArea.hidden &&
        !tracklistDatabase.classList.contains('enabled')
    ) {
        playerContainer.classList.add('justify-right');
    } else {
        playerContainer.classList.remove('justify-right');

        // Works when the window width has changed or
        // the settings are shown with window width == 'below-justify-right-min'
        if (
            winWidth < minWinWidthForSettings &&
            !tracklistDatabase.classList.contains('enabled') &&
            !settingsArea.hidden
        ) {
            scrollDoc('right', 'instant');
        }
    }
}

function highlightSelected(audio) {
    if (!audio) return;
    if (audio.hasAttribute('data-removed')) return;
    if (!settingsArea.classList.contains('active')) return;
    if (keysInfoArea.classList.contains('active')) return;

    //console.log('+ highlight');

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
    
    if (!highlightActiveElem) highlightActiveElem = document.activeElement;

    curPlaylist.select();
    curPlaylist.setSelectionRange(startPos, endPos, 'forward');
    if (curPlaylist != highlightActiveElem) curPlaylist.blur();

    // Scrolling to center textarea
    let deltaScroll;

    if (curPlaylist.scrollHeight > curPlaylist.clientHeight) {
        let curPlaylistStyle = getComputedStyle(curPlaylist);
        let rowHeight = parseFloat(curPlaylistStyle.lineHeight);
        let visibleRows = curPlaylist.clientHeight / rowHeight;
        let selectedRows = curPlaylist.value.slice(startPos, endPos).split(/\n/).length;
        let stringsTop = curPlaylist.value.slice(0, startPos).split(/\n/);
        let rowsTop = stringsTop.length - 1;

        deltaScroll = (rowsTop - Math.ceil((visibleRows - selectedRows) / 2)) * rowHeight;

        curPlaylist.scrollTo({
            left: 0,
            top: deltaScroll,
            behavior: 'smooth'
        });
    }

    // Checking scroll duration to return focus to the last active element
    if (!acceleration && !timerFinishPlay) {
        let scrollHeight = curPlaylist.scrollHeight;
        let clientHeight = curPlaylist.clientHeight;
        let lastScrollTop = curPlaylist.scrollTop;
        let isScrollActive = false;

        if (deltaScroll && deltaScroll != lastScrollTop) { // Only highlighting
            if (deltaScroll > 0) {
                if (scrollHeight - deltaScroll > clientHeight) {
                    isScrollActive = true;
                } else if (lastScrollTop < scrollHeight - clientHeight) {
                    isScrollActive = true;
                }
            } else if (lastScrollTop > 0) {
                isScrollActive = true;
            }
        }

        if (isScrollActive && hasScrollend) {
            eventManager.addOnceEventListener(curPlaylist, 'scrollend', () => scrollEndStates.curPlaylist = true);
        } else {
            scrollEndStates.curPlaylist = true;
        }
    }
}

function cancelReturningFocus() {
    clearTimeout(timerReturnFocusDelay);
    highlightActiveElem = null;
}

function getSettingsAreaWidth() {
    settingsArea.hidden = false;
    let width = settingsArea.offsetWidth;
    settingsArea.hidden = true;

    return width;
}

function resetSettings() {
    changeConfig(null);
    changePlayerColor(null);
    changePlaylistStyle(null);
    changeInitialVolume(null);
    changeNumberOfVisibleTracks(null);
    changeScrollElemsOpacity(null);
    changeWheelScrollStep(null);
    changeAddOptionsDisplaying(null);
}

//////////////////////
// Keys information //
//////////////////////

function keysInfoAction() {
    if (!keysInfoArea.classList.contains('active')) {
        showKeysInfo();
    } else {
        hideKeysInfo();
    }
}

function showKeysInfo() {
    keysInfoArea.hidden = false;
    keysInfoArea.offsetWidth;  // Causes a reflow
    keysInfoArea.classList.add('active');

    keysInfoAction.savedActiveElem = document.activeElement;

    tracklistDatabase.setAttribute('inert', '');
    player.setAttribute('inert', '');
    settingsArea.parentElement.setAttribute('inert', '');
}

function hideKeysInfo() {
    keysInfoArea.classList.remove('active');

    promiseChange(keysInfoArea, 'transition', 'opacity', keysInfoBtn, 'KeyI', () => {
        keysInfoArea.hidden = true;

        tracklistDatabase.removeAttribute('inert');
        player.removeAttribute('inert');
        settingsArea.parentElement.removeAttribute('inert');

        keysInfoAction.savedActiveElem?.focus();
        delete keysInfoAction.savedActiveElem;

        highlightSelected(selectedAudio);
    });
}

// Closing key info by clicking
keysInfoArea.onclick = (event) => {
    if (event.target == keysInfoBtn) return;
    if (event.target.closest('.keys-info') && !event.target.closest('.close-button')) return;

    hideKeysInfo();
};

/////////////////////
// Global handlers //
/////////////////////

// Checking document sizes
function getDocWidth() {
    return Math.max(
        document.body.scrollWidth, document.documentElement.scrollWidth,
        document.body.offsetWidth, document.documentElement.offsetWidth,
        document.body.clientWidth, document.documentElement.clientWidth
    );
}

function getDocHeight() {
    return Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
}

// Checking window sizes
function getWinWidth() {
    return isTouchDevice ? window.innerWidth : document.documentElement.clientWidth;
}

function getWinHeight() {
    return isTouchDevice ? window.innerHeight : document.documentElement.clientHeight;
}

// Check Y-scrollbar
function isDocScrollbarCheck() {
    let winHeight = getWinHeight();
    let docHeight = getDocHeight();

    return (docHeight > winHeight) ? true : false;
}

// Deleting temporary global variables
if (hasScrollend) {
    document.addEventListener('scrollend', () => {
        delete window.targetScrollPosX;
        delete window.targetScrollPosY;
    });
}

// Moving document left/right
function scrollDoc(direction, behavior = 'auto') {
    let x;
    
    if (direction === 'right') {
        let docWidth = getDocWidth();
        let winWidth = getWinWidth();
        let restDocWidth = docWidth - winWidth - window.scrollX;
        if (!restDocWidth) return false;

        x = docWidth;
    } else if (direction === 'left') {
        if (!window.scrollX) return false;

        x = 0;
    } else {
        console.error('invalid document scroll direction');
        return false;
    }
    
    if (hasScrollend) window.targetScrollPosX = x;
    
    window.scrollTo({
        left: x,
        top: (window.targetScrollPosY !== undefined) ? window.targetScrollPosY : window.scrollY,
        behavior
    });
    
    return true;
}

// Highlighting selected track in current playlist
document.addEventListener('click', (event) => {
    if (document.activeElement == curPlaylist) {
        if (highlightActiveElem) {
            cancelReturningFocus();
            stopScrolling(KEY_SCROLLING_TIME);
        }
    }

    if (document.activeElement == document.body) {
        if (highlightActiveElem) cancelReturningFocus();

        // Continuing scrolling the playlist if there is no doc scrollbar and active elem == body
        setTimeout(() => {
            let isDocScrollbar = isDocScrollbarCheck();
            if (!accelerateScrolling || isDocScrollbar) return;

            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            startScrolling(key);
        });
    }

    if (event.target.closest('#settings-area')) return;
    if (event.target.closest('#keys-info-area')) return;
    if (event.target.closest('#visible-playlist-area')) return;
    if (event.target.closest('i')) return;
    if (event.target.closest(`
        #tracklist-database input[type="checkbox"],
        #tracklist-database label,
        #tracklist-database .tracklist-title
    `)) return;
    
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
function initCheckboxEnterKeyDownConnections() {
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(elem => connectCheckboxEnterKeyDown(elem));
}

function connectCheckboxEnterKeyDown(elem) {
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
function initFocusHandlerConnections() {
    let focusingElems = document.querySelectorAll('input, button, textarea, #visible-playlist-area');
    focusingElems.forEach(elem => connectFocusHandler(elem));
}

function connectFocusHandler(elem) {
    elem.onfocus = function() {
        if (accelerateScrolling) {
            if (!scrollablePlaylist) return;

            let isDocScrollbar = isDocScrollbarCheck();
            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            let direction = scrollingKeysData[key].direction;
            let isReachingLimits = checkReachingPlaylistBoundaries(direction);

            // Quickly hide playlist scroll elements
            if (
                isReachingLimits &&
                this != visPlaylistArea &&
                isDocScrollbar &&
                !cursorOverPlaylist &&
                !pointerModeScrolling
            ) {
                hideScrollElems();
            }

            // Start/stop scrolling
            if (
                !highlightActiveElem && (
                    (this.matches('input[type="number"]') && (key == 'ArrowUp' || key == 'ArrowDown')) ||
                    (!this.matches('.tracklist-section') && this.scrollHeight > this.clientHeight) ||
                    (this != visPlaylistArea && isDocScrollbar && !cursorOverPlaylist && !pointerModeScrolling)
                )
            ) {
                stopScrolling(KEY_SCROLLING_TIME);
            } else if (
                    this == visPlaylistArea ||
                    this != curPlaylist && (
                        !isDocScrollbar ||
                        cursorOverPlaylist ||
                        pointerModeScrolling
                    )
            ) {
                startScrolling(key);
            }
        }

        // Cancelling returning focus on highlightActiveElem
        if (this != curPlaylist && highlightActiveElem) cancelReturningFocus();

        // Check reaching playlist limits when focusing on the last track via Tab
        if (this.matches('.track-info-box')) {
            document.getSelection().empty();
            if (!scrollablePlaylist) return;

            activateScrollArrows();
            checkReachingPlaylistBoundaries('all');
        }

        if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    };
}

// Alignment after auto scrolling focused track title
visPlaylistArea.addEventListener('keydown', function(event) {
    if (event.code != 'Tab') return;
    if (!scrollablePlaylist) return;
    if (activeScrollAndAlign) return;

    let selTrack;
    if (event.target == this) selTrack = playlist.firstElementChild;
    if (event.target.matches('.track-info-box')) {
        let track = event.target.closest('.track');
        selTrack = event.shiftKey ? track.previousElementSibling : track.nextElementSibling;
    }
    if (!selTrack) return;

    // Scrolling the document to center the selected track in the window
    let isPlaylistInView = isPlaylistInViewCheck();

    if (!isPlaylistInView) {
        let selTrackRect = selTrack.getBoundingClientRect();
        let winHeight = getWinHeight();
        let y;

        if (selTrackRect.top < playlistScrollArrowBoxHeight) {
            y = (Math.round(selTrackRect.bottom) > playlistScrollArrowBoxHeight) ?
                selTrackRect.top - playlistScrollArrowBoxHeight :
                selTrackRect.top - winHeight / 2 + selTrackRect.height / 2
            ;
        }
        if (selTrackRect.bottom > winHeight - playlistScrollArrowBoxHeight) {
            y = (Math.round(selTrackRect.top) < winHeight - playlistScrollArrowBoxHeight) ? 
                playlistScrollArrowBoxHeight - (winHeight - selTrackRect.bottom) :
                selTrackRect.bottom - winHeight / 2 - selTrackRect.height / 2
            ;
        }
        
        if (y) {
            window.scrollBy({
                left: 0,
                top: Math.ceil(y),
                behavior: 'instant'
            });
            return;
        }
    }

    // Showing scroll elements and aligning the playlist after auto-scrolling
    if (
        selTrack.offsetTop < playlistLim.scrollTop ||
        selTrack.offsetTop + selTrack.offsetHeight > playlistLim.scrollTop + playlistLim.offsetHeight
    ) {
        requestAnimationFrame(() => {
            showScrollElems();
            scrollAndAlignPlaylist({
                direction: (event.shiftKey || selTrack == playlist.firstElementChild) ? 'up' : 'down',
                duration: KEY_SCROLLING_TIME,
                hide: true
            });
        });
    }
});

// Stop scrolling on context menu
document.oncontextmenu = () => {
    if (accelerateScrolling) stopScrollingAndClean();
};

// Creating tooltips
function initTooltipHoverIntentConnections() {
    let tooltipElems = playerContainer.querySelectorAll('[data-tooltip]')
    tooltipElems.forEach(elem => connectTooltipHoverIntent(elem));
}

function connectTooltipHoverIntent(elem) {
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
}

// Promise change on pointer or key event
function promiseChange(animatedElem, animationType, animatedProp, btn, key, func) {
    // animatedProp is used for partial time to resolve the promise.
    // If the full animation time is needed, set it to "null".
    new Promise((resolve, reject) => {
        let animatedElemStyle = getComputedStyle(animatedElem || cssRoot);
        let animatedTime = animatedElem ?
            parseFloat(animatedElemStyle[`${animationType}Duration`]) * 1000 :
            parseInt(animatedElemStyle.getPropertyValue('--transition-time-primary'))
        ;

        if (animatedProp) {
            let curAnimatedPropValue = parseFloat(animatedElemStyle[animatedProp]);
            animatedTime *= curAnimatedPropValue;
        }

        let timerResolvePromise = setTimeout(resolvePromise, animatedTime);

        btn.addEventListener('click', rejectPromise);
        document.addEventListener('keyup', rejectPromise);

        function resolvePromise() {
            removeListeners();
            resolve();
        }

        function rejectPromise(event) {
            if (event.type == 'keyup' && event.code != key) return;

            clearTimeout(timerResolvePromise);
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
function highlightButton(btn, key, actionFunc, ...args) {
    highlightedBtns.set(key, btn);

    if (actionFunc == downKeyStepAccAction) {
        let keyAccType = stepKeysData[key].accelerationType;

        if (keyAccType != accelerationType) {
            btn.classList.add('key-pressed');
        }

        actionFunc(...args);
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

        // Run action function
        if (actionFunc == downKeyStepAccAction) {
            upKeyStepAccAction(key);
        } else {
            actionFunc(...args);
        }

        function checkHighlightedBtn() {
            for (let highlightedBtn of highlightedBtns.values()) {
                if (highlightedBtn == btn) return false;
            }
            return true;
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
            calcTracklistsContainerMaxHeight();
            calcTracklistDtbsBtnPosition();
            checkScrollElemsVisibility();

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
            calcTracklistsContainerMaxHeight();
            setDocScrollbarYWidth();
            checkPlayerContainertJustify();
            checkScrollElemsVisibility();
            checkTracklistDatabasePositionX();
            calcTracklistDtbsBtnPosition();

            resizeTick = false;
        });
    }
    
    resizeTick = true;
});
  
function checkScrollElemsVisibility() {
    let playlistContainerRect = playlistContainer.getBoundingClientRect();
    let playlistLimRect = playlistLim.getBoundingClientRect();
    let winHeight = getWinHeight();
    let isDocScrollbar = isDocScrollbarCheck();
    let isPlaylistInView = isPlaylistInViewCheck(playlistContainerRect);
    let heightShift = (isPlaylistInView || scrollablePlaylist) ? 0 : playlistScrollArrowBoxHeight;
    let docScrollArrowUpBox = docScrollArrowUp.parentElement;
    let docScrollArrowDownBox = docScrollArrowDown.parentElement;
    let playlistLimVisibleTop = 0;
    let playlistLimVisibleBottom = 0;

    // Checking playlist top
    if (playlistContainerRect.top < -heightShift) {
        if (scrollablePlaylist) {
            playlistLimVisibleTop = -playlistLimRect.top + playlistScrollArrowBoxHeight;
        }
        
        docScrollArrowUpBox.hidden = false;
    } else {
        docScrollArrowUpBox.hidden = true;
    }

    // Checking playlist bottom
    if (playlistContainerRect.bottom > winHeight + heightShift) {
        if (scrollablePlaylist) {
            playlistLimVisibleBottom = playlistLimRect.bottom - winHeight + playlistScrollArrowBoxHeight;
        }
        
        docScrollArrowDownBox.hidden = false;
    } else {
        docScrollArrowDownBox.hidden = true;
    }

    // Fixing the doc arrows container's height if only the doc arrow up is visible
    if (!docScrollArrowUpBox.hidden && docScrollArrowDownBox.hidden) {
        docScrollArrowsContainer.classList.add('fixed-height');
    } else {
        docScrollArrowsContainer.classList.remove('fixed-height');
    }

    // Fixing the doc arrows container's width if the doc arrows are hidden,
    // the player is not in view and a touch device is detected
    if (
        canAutoChangeWidth &&
        isDocScrollbar &&
        docScrollArrowUpBox.hidden && docScrollArrowDownBox.hidden
    ) {
        docScrollArrowsContainer.classList.add('fixed-width');
    } else {
        docScrollArrowsContainer.classList.remove('fixed-width');
    }

    // Adding a transparent mask to the playlist
    playlistLim.style.maskImage = (!playlistLimVisibleTop && !playlistLimVisibleBottom) ?
        'none' :
        `linear-gradient(
            transparent ${playlistLimVisibleTop}px,
            var(--color-primary) ${playlistLimVisibleTop}px,
            var(--color-primary) calc(100% - ${playlistLimVisibleBottom}px),
            transparent calc(100% - ${playlistLimVisibleBottom}px)
        )`
    ;
}

function isPlaylistInViewCheck(playlistContainerRect) {
    playlistContainerRect ??= playlistContainer.getBoundingClientRect();
    let winHeight = getWinHeight();

    if (playlistContainerRect.top < 0) return false;
    if (playlistContainerRect.bottom > winHeight) return false;

    return true;
}

function setDocScrollbarYWidth() {
    if (document.body.classList.contains('loading')) return;
    if (!scrollbarWidth) return;

    let isDocScrollbar = isDocScrollbarCheck();
    let curScrollbarYWidth = isDocScrollbar ? scrollbarWidth : 0;
    let savedScrollbarYWidth = parseInt(cssRoot.style.getPropertyValue('--document-scrollbar-y-width'));

    if (curScrollbarYWidth !== savedScrollbarYWidth) {
        cssRoot.style.setProperty('--document-scrollbar-y-width', curScrollbarYWidth + 'px');
    }
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

    eventManager.clearEventHandlers(playlistLim, 'scrollend');
    eventManager.addOnceEventListener(playlistLim, 'scrollend', () => checkReachingPlaylistBoundaries('up'));
};

playlistScrollArrowDown.onclick = () => {
    if (playlistScrollArrowDown.classList.contains('inactive')) return;

    playlistScrollArrowUp.classList.remove('inactive');

    playlistLim.scrollTo({
        left: 0,
        top: playlistLim.scrollHeight,
        behavior: 'smooth'
    });

    eventManager.clearEventHandlers(playlistLim, 'scrollend');
    eventManager.addOnceEventListener(playlistLim, 'scrollend', () => checkReachingPlaylistBoundaries('down'));
};

// Outer scroll arrows handlers
docScrollArrowUp.addEventListener('click', () => {
    let y = 0;
    if (hasScrollend) window.targetScrollPosY = y;

    window.scrollTo({
        left: (window.targetScrollPosX !== undefined) ? window.targetScrollPosX : window.scrollX,
        top: y,
        behavior: 'smooth'
    });
});

docScrollArrowDown.addEventListener('click', () => {
    let y = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );

    if (hasScrollend) window.targetScrollPosY = y;

    window.scrollTo({
        left: (window.targetScrollPosX !== undefined) ? window.targetScrollPosX : window.scrollX,
        top: y,
        behavior: 'smooth'
    });
});

////////////////////////////
// Touch device detection //
////////////////////////////

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

const canAutoChangeWidth = canAutoChangeWidthCheck();

function canAutoChangeWidthCheck() {
    document.body.style.width = document.body.offsetWidth + 50 + 'px';

    let docWidth = getDocWidth();
    let winWidth = window.innerWidth;

    document.body.style.width = '';

    return docWidth <= winWidth;
}

///////////////////////////
// Buttons configuration //
///////////////////////////

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

        if (oldValue) {
            configBtn.parentElement.classList.remove('rotate');

            let rotateTime = (changeConfig.eventType == 'keydown') ? LAG : 0;
            setTimeout(() => {
                configBtn.parentElement.classList.add('rotate');

                promiseChange(configBtn.parentElement, 'animation', null, configBtn, 'KeyZ', () => {
                    configBtn.parentElement.classList.remove('rotate');
                });
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

    if (changeConfig.eventType && !visibleTracksCheckbox.checked) {
        changeNumberOfVisibleTracks(numOfVisTracks);
    }

    delete changeConfig.eventType;

    highlightSelected(selectedAudio);
}

//////////////////////////////
// Number of visible tracks //
//////////////////////////////

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

    calcTracklistsContainerMaxHeight();
    setDocScrollbarYWidth();
    checkPlayerContainertJustify();
    checkPlaylistScrollability();
    checkScrollElemsVisibility();
    calcTracklistDtbsBtnPosition();
    scrollDoc('right', 'instant');

    if (accelerateScrolling) {
        let isDocScrollbar = isDocScrollbarCheck();

        if (isDocScrollbar) {
            stopScrolling(KEY_SCROLLING_TIME);
        } else {
            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            if (key == 'ArrowUp' || key == 'ArrowDown') return;
            
            startScrolling(key);
        }
    }

    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
}

/////////////////////
// Player coloring //
/////////////////////

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
    promiseChange(null, null, null, colorBtn, 'KeyX', () => player.classList.remove('changing-color'));
}

////////////////////
// Playlist style //
////////////////////

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

function changeInitialVolume(value) {
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

/////////////////////////////
// Scroll elements opacity //
/////////////////////////////

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

    playerContainer.style.setProperty('--scroll-elements-opacity', scrollElemsOpacity / 100);

}

///////////////////////
// Wheel scroll step //
///////////////////////

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

////////////////////////
// Tracklist database //
////////////////////////

const addOptionsCheckbox = document.getElementById('additional-options-checkbox');

addOptionsCheckbox.onchange = function() {
    changeAddOptionsDisplaying(this.checked);
};

function initAddOptionsCheckbox() {
    let isChecked = localStorage.getItem('add_options_checkbox_checked');
    addOptionsCheckbox.checked = isChecked === 'true';
    changeAddOptionsDisplaying(addOptionsCheckbox.checked);
}

function changeAddOptionsDisplaying(isChecked) {
    if (isChecked == null) isChecked = addOptionsCheckbox.checked = false;
    localStorage.setItem('add_options_checkbox_checked', isChecked);

    if (isChecked) {
        playerContainer.classList.add('add-options-active');
    } else {
        playerContainer.classList.remove('add-options-active');

        tracklistDatabase.querySelectorAll('input[type="checkbox"]').forEach(chBox => {
            chBox.checked = true;
            if (chBox.matches('[id$="all"]')) chBox.classList.remove('partial-list');
        });
    }

    calcTracklistsTextIndent();
}

async function calcTracklistsTextIndent(list = null) {
    if (document.body.classList.contains('loading')) return;
    if (!tracklistDatabase.classList.contains('enabled')) return;

    if (list) {
        runCalcTextIndent(list);
    } else {
        let addOptionsActivity = playerContainer.classList.contains('add-options-active') ? 'active' : 'disactive';
        if (tracklistsContainer.dataset.textIndentForAddOptions === addOptionsActivity) return;

        for (let tracklistSection of tracklistsContainer.children) {
            let list = tracklistSection.querySelector('.list');
            runCalcTextIndent(list);
        }

        tracklistsContainer.setAttribute('data-text-indent-for-add-options', addOptionsActivity);
    }

    function runCalcTextIndent(list) {
        if (!list.children.length) return;
    
        let checkboxWidth;
        let orderWidth = 0;

        for (let li of list.children) {
            let checkboxLabel = li.querySelector('input[type="checkbox"] + label');
            let orderSpan = li.querySelector('.order > span');

            if (!checkboxWidth) checkboxWidth = checkboxLabel.offsetWidth;
            if (orderSpan.offsetWidth > orderWidth) orderWidth = orderSpan.offsetWidth;
        }

        let listTextIndent = checkboxWidth + orderWidth;

        list.style.setProperty('--list-text-indent', listTextIndent + 'px');
        list.style.setProperty('--order-width', orderWidth + 'px');
    }
}

// Remove elem activity if elem is NOT in focus
tracklistDatabase.addEventListener('pointerdown', () => {
    let activeElem = document.activeElement;

    tracklistDatabase.addEventListener('pointerup', (event) => {
        const tracklistDtbsElem = event.target.closest('.tracklist-section, .add-controls-button');
        if (tracklistDtbsElem && tracklistDtbsElem != activeElem) tracklistDtbsElem.blur();
    }, {once: true});
});

tracklistDatabase.onclick = (event) => {
    let target;

    // Expand all tracklist details
    if (event.target == expandAllTrlDetailsBtn) {
        expandAllTracklistDetails();
    }

    // Collapse all tracklist details
    if (event.target == collapseAllTrlDetailsBtn) {
        collapseAllTracklistDetails();
    }

    // Clear playlist button
    if (event.target == clearPlaylistBtn) {
        clearPlaylist();
    }
    
    // Delete tracklist button
    if (target = event.target.closest('i[class*="delete-tracklist-tracks"]')) {
        const tracklistSection = target.closest('.tracklist-section');
        showTracklistDeletionConfirmation(tracklistSection);
    }

    // Tracklist title
    if (target = event.target.closest('.tracklist-title')) {
        const tracklistSection = target.closest('.tracklist-section');
        toggleTracklistDetails(tracklistSection);
    }

    // Replace/add to playlist buttons
    if (target = event.target.closest('i[class*="tracklist-to-playlist"]')) {
        const tracklistSection = target.closest('.tracklist-section');
        let clearPlaylist = target.hasAttribute('data-clear') ? true : false;
        addTracklistToPlaylist(tracklistSection, clearPlaylist);
    }
};

function expandAllTracklistDetails() {
    for (let tracklistSection of tracklistsContainer.children) {
        toggleTracklistDetails(tracklistSection, 'expand');
    }
}

function collapseAllTracklistDetails() {
    for (let tracklistSection of tracklistsContainer.children) {
        toggleTracklistDetails(tracklistSection, 'collapse');
    }
}

function clearPlaylist() {
    console.log('clear playlist');

    createPlaylist(null, true);
}

function toggleTracklistDetails(tracklistSection, targetState = null) {
    const tracklistDetails = tracklistSection.querySelector('.tracklist-details');

    if (tracklistDetails.style.height === '0px' && targetState === 'collapse') return;
    if (tracklistDetails.style.height !== '0px' && targetState === 'expand') return;

    let trlDetailsId = tracklistDetails.id;
    cancelAnimationFrame(trlDetailsAnimationFrameIds[trlDetailsId]);

    playerContainer.style.minHeight = '';

    tracklistsContainer.setAttribute('data-toggle-tracklist-details', '');

    if (tracklistDetails.style.height === '0px') {
        tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
    } else {
        tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
        tracklistDetails.offsetHeight; // Causes a reflow
        tracklistDetails.style.height = 0;
    }

    eventManager.addOnceEventListener(tracklistDetails, 'transitionend', endHeightChanging);
    trlDetailsAnimationFrameIds[trlDetailsId] = requestAnimationFrame(checkScrollabilities);

    connectCheckboxLabelsFocus(tracklistDetails);
    setCheckboxChangeHandlers(tracklistDetails);

    function endHeightChanging() {
        cancelAnimationFrame(trlDetailsAnimationFrameIds[trlDetailsId]);
        delete trlDetailsAnimationFrameIds[trlDetailsId];

        let isExpanded = tracklistDetails.style.height !== '0px';
        tracklistSection.setAttribute('aria-expanded', String(isExpanded));
        if (isExpanded) tracklistDetails.style.height = 'auto';

        if (!Object.keys(trlDetailsAnimationFrameIds).length) {
            tracklistsContainer.removeAttribute('data-toggle-tracklist-details');
            checkTracklistDtbsAction();
        }
    }
    
    function checkScrollabilities() {
        setDocScrollbarYWidth();
        checkTracklistsContainerScrollability();
        
        trlDetailsAnimationFrameIds[trlDetailsId] = requestAnimationFrame(checkScrollabilities);
    }
}

function addTracklistToPlaylist(tracklistSection, clearPlaylist) {
    if (clearPlaylist && removingTracksNum && playlist.children.length > 100) return;

    console.log('playlist changed');
    
    const checkboxAll = tracklistSection.querySelector('header input[type="checkbox"]');
    const list = tracklistSection.querySelector('.list');
    let listLength = list.children.length;
    let noTracksChecked = !listLength || (!checkboxAll.checked && !checkboxAll.classList.contains('partial-list'));
    let tracklist = noTracksChecked ? null : getSelectedTracks(list);

    createPlaylist(tracklist, clearPlaylist);

    if (shuffleBtn.classList.contains('active')) randomizePlaylist();
    if (!clearPlaylist) highlightSelected(selectedAudio);

    function getSelectedTracks(list) {
        return [].reduce.call(list.children, (tracklist, trackInTracklist) => {
            let isChecked = trackInTracklist.querySelector('input[type="checkbox"]').checked;

            if (isChecked) {
                let artist = trackInTracklist.querySelector('.track-artist').textContent;
                let title = trackInTracklist.querySelector('.track-title').textContent;
                let src = trackInTracklist.dataset.src;
        
                tracklist.push({ artist, title, src });
            }

            return tracklist;
        }, []);
    }
}

function showTracklistDeletionConfirmation(tracklistSection) {
    const tracklistTitle = tracklistSection.querySelector('.tracklist-title').textContent;
    const tracklistDetails = tracklistSection.querySelector('.tracklist-details');
    const list = tracklistDetails.querySelector('.list');
    const checkboxAll = tracklistDetails.querySelector('header input[type="checkbox"]');
    let listLength = list.children.length;
    let noTracksChecked = !checkboxAll.checked && !checkboxAll.classList.contains('partial-list');
    let deletingList = [];

    if (listLength) {
        if (noTracksChecked) {
            const okBtn = tracklistDelConfirm.querySelector('.button-ok');
            okBtn.classList.add('inactive');
            okBtn.disabled = true;
        } else {
            const delTracks = tracklistDelConfirm.querySelector('.deleting-tracks');
    
            for (let trackInTracklist of list.children) {
                let isChecked = trackInTracklist.querySelector('input[type="checkbox"]').checked;
    
                if (isChecked) {
                    let trackInfo = trackInTracklist.textContent.replace(/\d+\./, '');
                    delTracks.innerHTML += `<li>${trackInfo}</li>`;
    
                    deletingList.push(trackInTracklist);
                }
            };
        }
    }

    let delListLength = deletingList.length;
    let delTracksInfo = !delListLength ? 'No' : (delListLength < listLength) ? delListLength : 'All';
    tracklistDelConfirm.querySelector('.deleting-tracks-number').textContent = delTracksInfo;
    tracklistDelConfirm.querySelector('.plural-suffix').textContent = (delListLength === 1) ? '' : 's';
    tracklistDelConfirm.querySelector('.target-tracklist').textContent = tracklistTitle;

    if (delTracksInfo === 'No') {
        tracklistDelConfirm.querySelector('#deletion-confirm-description').classList.add('period');

        if (listLength) {
            tracklistDelConfirm.querySelector('.warning-info').hidden = true;
        } else {
            tracklistDelConfirm.querySelector('.empty-tracklist-removal-confirm').hidden = false;
        }
    } else if (delTracksInfo === 'All') {
        tracklistDelConfirm.querySelector('.tracklist-removal-confirm').hidden = false;
    }

    tracklistDelConfirm.hidden = false;
    tracklistDelConfirm.offsetWidth;  // Causes a reflow
    tracklistDelConfirm.classList.add('active');

    showTracklistDeletionConfirmation.savedActiveElem = document.activeElement;

    tracklistDatabase.setAttribute('inert', '');
    player.setAttribute('inert', '');
    settingsArea.parentElement.setAttribute('inert', '');

    tracklistDelConfirm.onclick = (event) => {
        if (event.target.closest('.button-ok')) {
            if (delListLength) {
                confirmTracksDeletion();
            } else {
                deleteTracklistSection();
            }
        }

        if (
            event.target.closest('.close-button') ||
            event.target.closest('.button-cancel') ||
            !event.target.closest('.dialog-box')
        ) {
            hideTracklistDeletionConfirmation();
        }
    };

    function confirmTracksDeletion() {
        console.log(`%cdelete tracks from "${tracklistTitle}" tracklist`, `
            color: #fafafa;
            background-color: rgba(196, 13, 43, 0.9);
        `);

        let shouldDeleteTrlSection = !tracklistDelConfirm.querySelector('.tracklist-removal-confirm').hidden &&
            tracklistDelConfirm.querySelector('.tracklist-removal-confirm input[type="checkbox"]').checked;
        let liHeight = getComputedStyle(list.firstElementChild).height;
        let deleteSrcSet = new Set();
    
        // Remove tracks in tracklist
        deletingList.forEach(trackInTracklist => {
            let src = trackInTracklist.dataset.src;
            deleteSrcSet.add(src);
    
            trackInTracklist.style.height = liHeight;
            trackInTracklist.classList.add('deleting');

            eventManager.addOnceEventListener(trackInTracklist, 'animationend', removeTrackFromTracklist);
        });

        // Remove tracks in playlist
        [].forEach.call(playlist.children, (trackInPlaylist, idx) => {
            let audioSrc = trackInPlaylist.querySelector('audio').dataset.src;

            // If test cache clearing is enabled
            let noCacheIdx = audioSrc.indexOf('?nocache=');
            if (noCacheIdx !== -1) audioSrc = audioSrc.slice(0, audioSrc.indexOf('?nocache='));

            if (deleteSrcSet.has(audioSrc)) {
                if (trackInPlaylist.classList.contains('pending-removal')) return;
                if (trackInPlaylist.classList.contains('removing')) return;

                trackInPlaylist.classList.add('pending-removal');
                setAnimationDelay(idx, () => removeTrackFromPlaylist(trackInPlaylist));
            }
        });

        hideTracklistDeletionConfirmation();
    
        function removeTrackFromTracklist(event) {
            event.target.remove();
            deletingList.shift();
            if (!deletingList.length) finalizeTracksDeleting();
        }
    
        function finalizeTracksDeleting() {
            if (shouldDeleteTrlSection) {
                deleteTracklistSection();
            } else {
                checkboxAll.checked = false;
                checkboxAll.classList.remove('partial-list');
        
                // Reorder indices
                [].forEach.call(list.children, (trackInTracklist, idx) => {
                    trackInTracklist.querySelector('.order > span').textContent = `${idx + 1}.`;
                });

                if (tracklistDetails.style.height !== '0px') {
                    calcTracklistsTextIndent(list);
                    connectCheckboxLabelsFocus(tracklistDetails);
                    setCheckboxChangeHandlers(tracklistDetails);
                }
            }
        }
    }

    function deleteTracklistSection() {
        console.log(`%cdelete "${tracklistTitle}" tracklist section`, `
            color: #fafafa;
            background-color: rgba(196, 13, 43, 0.9);
        `);

        tracklistSection.classList.remove('show');

        eventManager.addOnceEventListener(tracklistSection, 'transitionend', runDeleteTracklistSection);

        if (tracklistDelConfirm.classList.contains('active')) hideTracklistDeletionConfirmation();

        function runDeleteTracklistSection() {
            let tracklistSectionStyle = getComputedStyle(tracklistSection);
            let marginTop = tracklistSectionStyle.getPropertyValue('--tracklist-section-margin-top');
            let curMarginTop = tracklistSectionStyle.marginTop;
            
            if (curMarginTop !== marginTop) { // First tracklist section
                tracklistSection.style.setProperty('--delete-animation-margin-top', '-' + marginTop);
            }
            
            tracklistSection.style.height = tracklistSectionStyle.height;

            tracklistSection.classList.add('deleting');

            eventManager.addOnceEventListener(tracklistSection, 'animationend', () => {
                if (document.activeElement == tracklistSection) {
                    let nextActiveSection = tracklistSection.nextElementSibling || tracklistSection.previousElementSibling;
                    nextActiveSection?.focus();
                }

                tracklistSection.remove();
            });
        }
    }
}

function hideTracklistDeletionConfirmation() {
    tracklistDelConfirm.onclick = () => false;

    tracklistDelConfirm.classList.remove('active');

    eventManager.addOnceEventListener(tracklistDelConfirm, 'transitionend', () => {
        tracklistDelConfirm.hidden = true;

        tracklistDelConfirm.querySelector('#deletion-confirm-description').classList.remove('period');
        tracklistDelConfirm.querySelector('.deleting-tracks-number').textContent = '';
        tracklistDelConfirm.querySelector('.target-tracklist').textContent = '';
        tracklistDelConfirm.querySelector('.deleting-tracks').textContent = '';
        tracklistDelConfirm.querySelector('.tracklist-removal-confirm').hidden = true;
        tracklistDelConfirm.querySelector('.tracklist-removal-confirm input[type="checkbox"]').checked = true;
        tracklistDelConfirm.querySelector('.empty-tracklist-removal-confirm').hidden = true;
        tracklistDelConfirm.querySelector('.warning-info').hidden = false;
        tracklistDelConfirm.querySelector('.button-ok').classList.remove('inactive');
        tracklistDelConfirm.querySelector('.button-ok').disabled = false;

        tracklistDatabase.removeAttribute('inert');
        player.removeAttribute('inert');
        settingsArea.parentElement.removeAttribute('inert');

        showTracklistDeletionConfirmation.savedActiveElem?.focus();
        delete showTracklistDeletionConfirmation.savedActiveElem;

        highlightSelected(selectedAudio);
    });
}

function connectCheckboxLabelsFocus(tracklistDetails) {
    const checkboxLabels = tracklistDetails.querySelectorAll('label.designed-checkbox');
    checkboxLabels.forEach(label => label.tabIndex = (tracklistDetails.style.height !== '0px') ? 0 : -1);
}

function setCheckboxChangeHandlers(tracklistDetails) {
    const checkboxAll = tracklistDetails.querySelector('header input[type="checkbox"]');
    const listCheckboxes = tracklistDetails.querySelectorAll('.list input[type="checkbox"]');

    if (tracklistDetails.style.height !== '0px') {
        checkboxAll.onchange = () => {
            listCheckboxes.forEach(chBox => chBox.checked = checkboxAll.checked);
            checkboxAll.classList.remove('partial-list');
        };

        listCheckboxes.forEach(chBox => {
            chBox.onchange = () => {
                const checkedListCheckboxes = tracklistDetails.
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

function checkTracklistDatabasePositionX() {
    let maxWinWidthForTracklistsDtbs = maxTracklistDtbsWidth * 2 + player.offsetWidth;

    if (window.innerWidth <= maxWinWidthForTracklistsDtbs) {
        tracklistDatabase.classList.add('sticked-left');
    } else {
        tracklistDatabase.classList.remove('sticked-left');
    }
}

function calcTracklistsContainerMaxHeight() {
    if (document.body.classList.contains('loading')) return;
    if (!tracklistDatabase.classList.contains('enabled')) return;

    playerContainer.style.minHeight = '';

    let winHeight = getWinHeight();
    let tracklistDtbsTop = Math.max(tracklistDatabase.getBoundingClientRect().top, 0);
    let restTracklistDtbsHeight = tracklistDatabase.offsetHeight - tracklistsContainer.offsetHeight;
    let maxTracklistsContainerHeight = winHeight - tracklistDtbsTop - restTracklistDtbsHeight -
        (playerContainerPaddingBottom - siteFooterHeight);

    let playerContainerBottom = playerContainer.getBoundingClientRect().bottom;
    let tracklistDtbsBottomHeight = playerContainerBottom - winHeight - siteFooterHeight;

    if (
        playerContainer.offsetHeight > winHeight &&
        tracklistDtbsBottomHeight < 0
    ) {
        maxTracklistsContainerHeight += tracklistDtbsBottomHeight;
    }

    tracklistsContainer.style.maxHeight = maxTracklistsContainerHeight + 'px';
    playerContainer.style.minHeight = '';

    checkTracklistsContainerScrollability();
}

function checkTracklistsContainerScrollability() {
    if (tracklistsContainer.scrollHeight > tracklistsContainer.offsetHeight) {
        tracklistsContainer.classList.add('scrollable');
    } else {
        tracklistsContainer.classList.remove('scrollable');
    }
}

/////////////////////////////////
// Tracklist database creation //
/////////////////////////////////

let tracklistNum = 0;

function createTracklistDatabase(tracklists) {
    for (let tracklistTitle in tracklists) {
        createTracklistSection(tracklistTitle, tracklists[tracklistTitle]);
    }

    checkTracklistDatabasePositionX();

    // First player load, gaining access to first tracklist after creating tracklist database
    if (!curTracklist) {
        curTracklist = tracklists[Object.keys(tracklists)[0]] ? 
            tracklists[Object.keys(tracklists)[0]].tracks :
            [];
    }
}

function createTracklistSection(tracklistTitle, tracklist) {
    tracklistNum++;

    tracklistTitle = tracklistTitle.replace(/(--)|(\s-\s)/g, (match, p1, p2) => {
        if (match == p1) return '<wbr>/<wbr>';
        if (match == p2) return ' \u2013 ';
    });
    
    let tracklistSection = document.createElement('section');
    tracklistSection.className = 'tracklist-section';
    tracklistSection.setAttribute('aria-labelledby', `tracklist[${tracklistNum}]-title`);
    tracklistSection.setAttribute('aria-expanded', 'false');
    tracklistSection.setAttribute('aria-controls', `trlDetails[${tracklistNum}]`);
    tracklistSection.tabIndex = 0;
    tracklistsContainer.append(tracklistSection);
    
    connectFocusHandler(tracklistSection);

    let menu = document.createElement('div');
    menu.className = 'tracklist-menu';
    menu.innerHTML = `
        <div class="buttons-box left">
            <i class="icon-cancel delete-tracklist-tracks" data-tooltip="Delete tracklist tracks"></i>
        </div>
        <div class="tracklist-title-box">
            <h4><span id="tracklist[${tracklistNum}]-title" class="tracklist-title"
                data-tooltip="Show/hide details">${tracklistTitle}</span></h4>
        </div>
        <div class="buttons-box right">
            <i class="icon-list tracklist-to-playlist-replace" data-tooltip="Replace playlist" data-clear></i>
            <i class="icon-list-add tracklist-to-playlist-add" data-tooltip="Add to playlist"></i>
        </div>
    `;
    tracklistSection.appendChild(menu);

    menu.querySelectorAll('[data-tooltip]').forEach(elem => connectTooltipHoverIntent(elem));

    let details = document.createElement('div');
    details.className = 'tracklist-details';
    details.style.height = 0;
    details.setAttribute('id', `trlDetails[${tracklistNum}]`);
    tracklistSection.appendChild(details);

    let header = document.createElement('header');
    header.innerHTML = `
        <p>
            <input id="checkbox-tracklist[${tracklistNum}]-all" type="checkbox" checked
            ><label for="checkbox-tracklist[${tracklistNum}]-all" class="designed-checkbox"></label
            ><label for="checkbox-tracklist[${tracklistNum}]-all"><span>Check/uncheck all tracks</span></label>
        </p>
    `;
    details.appendChild(header);

    let headerCheckboxLabel = header.querySelector('label.designed-checkbox');
    connectFocusHandler(headerCheckboxLabel);
    connectCheckboxEnterKeyDown(headerCheckboxLabel);

    let detailsMain = document.createElement('main');
    detailsMain.className = 'details-main';
    details.appendChild(detailsMain);

    if (tracklist.cover) {
        let coverBox = document.createElement('div');
        coverBox.className = 'cover-box';
        coverBox.innerHTML = `<img src="${tracklist.cover}" alt="${tracklistTitle} Cover">`;
        detailsMain.appendChild(coverBox);

        details.classList.add('is-cover');
    }

    let list = document.createElement('ul');
    list.className = 'list';
    detailsMain.appendChild(list);

    let trackNum = 0;
    let hidenity = 'hidden';
    let firstTackArtist = tracklist.tracks[0].artist;

    for (let track of tracklist.tracks) {
        if (track.artist != firstTackArtist) {
            hidenity = '';
            break;
        }
    }

    tracklist.tracks.forEach(track => {
        trackNum++;

        let li = document.createElement('li');
        li.setAttribute('data-src', track.src);
        li.innerHTML = `
            <input id="checkbox-tracklist[${tracklistNum}]-track[${trackNum}]" type="checkbox" checked
            ><label for="checkbox-tracklist[${tracklistNum}]-track[${trackNum}]" class="designed-checkbox"></label
            ><label for="checkbox-tracklist[${tracklistNum}]-track[${trackNum}]"
                ><div class="order"><span>${trackNum}.</span></div
                ><span class="track-artist"${ hidenity}>${track.artist}</span
                ><span class="hyphen"${ hidenity}> &ndash; </span
                ><span class="track-title">${track.title}</span>
            </label> 
        `;
        list.appendChild(li);

        let liCheckboxLabel = li.querySelector('label.designed-checkbox');
        connectFocusHandler(liCheckboxLabel);
        connectCheckboxEnterKeyDown(liCheckboxLabel);
    });

    // When creating a new tracklist in the database
    calcTracklistsTextIndent(list);
    calcTracklistsContainerMaxHeight();
    setDocScrollbarYWidth();
}

///////////////////////
// Playlist creation //
///////////////////////

let curTracklist = JSON.parse(localStorage.getItem('current_tracklist'));

function createPlaylist(addedTracklist, clearPlaylist) {
    if (addedTracklist) addedTracklist = JSON.parse(JSON.stringify(addedTracklist));

    let isTracksRemoving = false;
    let scrollBeforeRemove = false;

    if (playerContainer.hasAttribute('data-initial')) {
        playerContainer.removeAttribute('data-initial');
    } else {
        markDuplicates(addedTracklist);

        // The current tracklist will be updated and saved after the removal of each track
        if (clearPlaylist && playlist.children.length) {
            playlist.removeAttribute('adding-tracks');
            isTracksRemoving = true;

            if (scrollablePlaylist && playlistLim.scrollTop && !activeScrollKeys.size) {
                scrollBeforeRemove = true;
                scrollPlaylistToTop();
            } else {
                runRemoveTracks();
            }
        } else { // Saving the current tracklist if the playlist tracks are not removing
            localStorage.setItem('current_tracklist', JSON.stringify(curTracklist));
        }
    }

    if (scrollBeforeRemove) {
        eventManager.addOnceEventListener(document, 'scrollAndAlignPlaylistEnd', () => {
            setTimeout(() => {
                runRemoveTracks();
                createHtmlElements();
            }, 120);
        });
    } else {
        createHtmlElements();
    }

    function scrollPlaylistToTop() {
        showScrollElems();
        scrollAndAlignPlaylist({
            direction: 'up',
            deltaHeight: playlistLim.scrollTop,
            align: false,
            hide: true
        });
    }

    function markDuplicates(addedTracklist) {
        if (!addedTracklist) return;

        for (let trackObj of curTracklist) {
            delete trackObj['dub'];
        }

        curTracklist = curTracklist.concat(addedTracklist);

        for (let i = 0; i < curTracklist.length; i++) {
            let dub = curTracklist[i]['dub'];
            if (dub) continue;

            let artist = curTracklist[i]['artist'];
            let title = curTracklist[i]['title'];
            let k = 1;
    
            for (let j = i + 1; j < curTracklist.length; j++) {
                let comparedArtist = curTracklist[j]['artist'];
                let comparedTitle = curTracklist[j]['title'];
        
                if (comparedArtist === artist && comparedTitle === title) {
                    curTracklist[j]['dub'] = ++k;
                }
            }
        }
    }
    
    function createHtmlElements() {
        if (!addedTracklist || !addedTracklist.length) return;

        let addedTracks = [];

        addedTracklist.forEach(trackObj => {
            let artist = trackObj['artist'];
            let title = trackObj['title'];
            let src = trackObj['src'];
            let dub = trackObj['dub'];
    
            let track = document.createElement('div');
            track.className = 'track not-ready';
            playlist.appendChild(track);

            addedTracks.push(track);
        
            let audio = document.createElement('audio');
            audio.setAttribute('data-artist', artist);
            audio.setAttribute('data-title', title);
            src += '?nocache=' + Math.random(); // Test cache clearing
            audio.setAttribute('data-src', src);
            if (dub) audio.setAttribute('data-dub', dub);
            audio.setAttribute('type', 'audio/mpeg');
            audio.setAttribute('preload', 'auto');
            track.appendChild(audio);
    
            origOrderedAudios.push(audio);
    
            let additionals = document.createElement('div');
            additionals.className = 'additionals';
            track.appendChild(additionals);
    
            let removeTrackBtn = document.createElement('i');
            removeTrackBtn.className = 'icon-cancel remove-track';
            removeTrackBtn.setAttribute('data-tooltip', 'Remove track');
            additionals.appendChild(removeTrackBtn);
    
            connectTooltipHoverIntent(removeTrackBtn);
    
            let loadFig = document.createElement('div');
            loadFig.className = 'loading-figure';
            additionals.appendChild(loadFig);
            
            let trackInfoBox = document.createElement('div');
            trackInfoBox.className = 'track-info-box';
            trackInfoBox.tabIndex = 0;
            track.appendChild(trackInfoBox);
    
            connectFocusHandler(trackInfoBox);

            let artistNameLim = document.createElement('div');
            artistNameLim.className = 'artist-name-limiter';
            trackInfoBox.appendChild(artistNameLim);

            let artistName = document.createElement('span');
            artistName.className = 'artist-name';
            artistName.setAttribute('data-actionable', '');
            artistName.textContent = artist;
            artistNameLim.appendChild(artistName);
        
            let trackTitleLim = document.createElement('div');
            trackTitleLim.className = 'track-title-limiter';
            trackInfoBox.appendChild(trackTitleLim);
        
            let trackTitle = document.createElement('span');
            trackTitle.className = 'track-title';
            trackTitle.setAttribute('data-actionable', '');
            trackTitle.textContent = title;
            if (dub) trackTitle.textContent += ' (' + dub + ')';
            trackTitleLim.appendChild(trackTitle);
        });
        
        setOrigPlaylistOrder();

        if (isTracksRemoving || removingTracksNum) {
            eventManager.addOnceEventListener(document, 'removingTracksEnd', () => runAddTracks(addedTracks));
        } else {
            runAddTracks(addedTracks);
        }
    }
            
    function runAddTracks(addedTracks) {
        addedTracks.forEach((track, idx) => {
            setAnimationDelay(idx, () => {
                if (track.classList.contains('pending-removal')) return;
                if (track.classList.contains('removing')) return;
    
                playlist.setAttribute('adding-tracks', '');
                track.classList.add('adding');
    
                eventManager.addOnceEventListener(track, 'animationend', () => {
                    if (track.classList.contains('removing')) return;
    
                    track.classList.remove('adding');
                    track.classList.remove('not-ready');
    
                    checkPlaylistScrollability();
                    checkScrollElemsVisibility();
    
                    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    
                    // Last added track
                    if (idx == addedTracks.length - 1) {
                        playlist.removeAttribute('adding-tracks');
    
                        if (!accelerateScrolling) {
                            stopScrolling(KEY_SCROLLING_TIME);
                        } else if (!activeScrollOnKeyRepeat) {
                            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
                            let canPlaylistScrolling = canPlaylistScrollingCheck(key);
                            if (canPlaylistScrolling) startScrolling(key);
                        }
                    }
                });
            });
        });
    }

    function runRemoveTracks() {
        [].forEach.call(playlist.children, (track, idx) => {
            if (track.classList.contains('pending-removal')) return;
            if (track.classList.contains('removing')) return;

            track.classList.add('pending-removal');
            setAnimationDelay(idx, () => removeTrackFromPlaylist(track));
        });
    }
}

function setAnimationDelay(k, func) {
    // The initial value of the parameter k is the index of the element in the array
    let callback = () => k-- ? setAnimationDelay(k, func) : func();
    requestAnimationFrame(callback);
}

//////////////////////////////////
// Last played track start info //
//////////////////////////////////

function showLastPlayedTrackInfo() {
    startInfoDisplay.setAttribute('data-displayed', '');

    if (selectedAudio) return;

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

    startInfoDisplay.innerHTML = startInfo;
    startInfoDisplay.hidden = false;

    setTimeout(() => {
        startInfoDisplay.style.opacity = 1;

        let transTime = parseFloat(getComputedStyle(startInfoDisplay).transitionDuration) * 1000;
        setTimeout(() => {
            startInfoDisplay.scrollTop = startInfoDisplay.scrollHeight;
            
            setTimeout(() => {
                startInfoDisplay.style.opacity = '';
    
                setTimeout(() => startInfoDisplay.hidden = true, transTime);
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

//////////////////
// Key handlers //
//////////////////

function connectKeyHandlers() {
    // Document keys, no modifiers or repeat
    document.addEventListener('keydown', (event) =>  {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;

        //Playing/pausing audio
        if (event.code == 'KeyW' || event.code == 'Space') {
            event.preventDefault();
            highlightButton(playPauseBtn, event.code, playPauseAction);
        }
        // Stoping audio
        if (event.code == 'KeyS') {
            highlightButton(stopBtn, event.code, stopAction);
        }

        // Stepping/accelerating audio
        if (
            (event.code == 'ArrowLeft' || event.code == 'ArrowRight' ||
            event.code == 'KeyA' || event.code == 'KeyD') 
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

        // Randomizing playlist
        if (event.code == 'KeyQ') {
            let btn = shuffleBtn.closest('.btn-img-wrapper');
            highlightButton(btn, event.code, shuffleAction);
        }
        // Repeating track/playlist
        if (event.code == 'KeyE') {
            let btn = repeatBtn.closest('.btn-img-wrapper');
            highlightButton(btn, event.code, repeatAction);
        }

        // Changing buttons configuration
        if (event.code == 'KeyZ') {
            changeConfig.eventType = event.type;
            let idx = configsBank.indexOf(config);
            highlightButton(configBtn, event.code, changeConfig, idx + 1);
        }
        // Changing player coloring
        if (event.code == 'KeyX') {
            let idx = playerColorsBank.indexOf(playerColor);
            highlightButton(colorBtn, event.code, changePlayerColor, idx + 1);
        }
        // Changing playlist style
        if (event.code == 'KeyC') {
            let idx = playlistStylesBank.indexOf(playlistStyle);
            highlightButton(playlistStyleBtn, event.code, changePlaylistStyle, idx + 1);
        }

        // Showing/hiding settings
        if (event.code === 'KeyF') {
            highlightButton(settingsBtn, event.code, settingsAction);
        }
        // Showing/hiding keys info
        if (event.code === 'KeyI') {
            highlightButton(keysInfoBtn, event.code, keysInfoAction);
        }

        // Showing/hiding tracklist database
        if (event.code === 'KeyT') {
            highlightButton(tracklistDtbsBtn, event.code, tracklistDatabaseAction);
        }

        // Expanding all tracklist details
        if (event.code === 'NumpadAdd') {
            highlightButton(expandAllTrlDetailsBtn, event.code, expandAllTracklistDetails);
        }
        // Collapsing all tracklist details
        if (event.code === 'NumpadSubtract') {
            highlightButton(collapseAllTrlDetailsBtn, event.code, collapseAllTracklistDetails);
        }
        // Clearing playlist
        if (event.code == 'Backspace') {
            if (document.activeElement.matches('input[type="number"]')) return;

            highlightButton(clearPlaylistBtn, event.code, clearPlaylist);
        }

        // Closing keys info and settings by keypressing "Escape"
        if (event.code == 'Escape') {
            const areas = [
                { element: tracklistDelConfirm, action: hideTracklistDeletionConfirmation },
                { element: keysInfoArea, action: hideKeysInfo },
                { element: settingsArea, action: hideSettings }
            ];
            
            for (let { element, action } of areas) {
                if (element.classList.contains('active')) {
                    let closeBtn = element.querySelector('.close-button');
                    highlightButton(closeBtn, event.code, action);
                    break;
                }
            }
        }
    });

    // Сhanging volume
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        // On/off volume
        if ((event.code == 'KeyM' || (event.code == 'KeyR' && !event.shiftKey))) {
            if (event.repeat) return;

            highlightButton(volumeBtn, event.code, volumeAction);
        }
        // Increasing volume
        if ((event.shiftKey && event.code == 'ArrowUp') || event.code == 'Period') {
            let keyRepeat = event.repeat ? true : false;
            changeVolumeAction('increase', keyRepeat);
        }
        // Reducing volume
        if ((event.shiftKey && event.code == 'ArrowDown') || event.code == 'Comma') {
            let keyRepeat = event.repeat ? true : false;
            changeVolumeAction('reduce', keyRepeat);
        }
    });

    // Scrolling playlist
    document.addEventListener('keydown', (event) =>  {
        if (event.shiftKey && (event.code == 'ArrowUp' || event.code == 'ArrowDown')) return;

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

    // Focusing tracks
    visPlaylistArea.addEventListener('keydown', function (event) {
        let trackInfoBox = event.target.closest('.track-info-box');
        if (!trackInfoBox || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;

        // Select track in playlist
        if (event.key == 'Enter') {
            let track = trackInfoBox.closest('.track');
            document.getSelection().empty();
            highlightButton(playPauseBtn, event.code, selectTrackInPlaylist, track);
        }
        // Remove track from playlist
        if (event.key == 'Delete') {
            let track = trackInfoBox.closest('.track');
            let removeTrackBtn = track.querySelector('.remove-track');
            highlightButton(removeTrackBtn, event.code, removeTrackFromPlaylist, track, event.type);
        }
    });

    // Focusing tracklists
    tracklistDatabase.addEventListener('keydown', (event) => {
        let tracklistSection = event.target.closest('.tracklist-section');
        if (!tracklistSection || event.ctrlKey || event.repeat) return;

        // Expanding tracklist section
        if (event.key == 'Enter' && !event.shiftKey) {
            if (tracklistSection != document.activeElement) return;
            
            let tracklistTitle = tracklistSection.querySelector('.tracklist-title');
            highlightButton(tracklistTitle, event.code, toggleTracklistDetails, tracklistSection);
        }
        // Delete tracks from tracklist
        if (event.code == 'Delete' && !event.shiftKey) {
            let delBtn = tracklistSection.querySelector('.delete-tracklist-tracks');
            highlightButton(delBtn, event.code, showTracklistDeletionConfirmation, tracklistSection);
        }
        // Clear playlist and add tracks from tracklist
        if ((event.altKey || event.metaKey) && (event.key == 'Insert' || event.code == 'NumpadAdd')) {
            let replaceBtn = tracklistSection.querySelector('i.tracklist-to-playlist-replace');
            highlightButton(replaceBtn, event.code, addTracklistToPlaylist, tracklistSection, true);
        }
        // Add tracks from tracklist
        if (event.shiftKey && (event.key == 'Insert' || event.code == 'NumpadAdd')) {
            let addBtn = tracklistSection.querySelector('i.tracklist-to-playlist-add');
            highlightButton(addBtn, event.code, addTracklistToPlaylist, tracklistSection, false);
        }
    });

    // Enable focus on visPlaylistArea when switching focus back from curPlaylist
    curPlaylist.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        if (event.code == 'Tab' && event.shiftKey) {
            event.preventDefault();
            visPlaylistArea.focus();
        }
    });

    // Temporary check handler
    document.addEventListener('keydown', (event) => {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
        if (event.code == 'KeyG') {
            //console.log(document.activeElement);
            //console.log(highlightActiveElem);
            console.log(eventManager.eventTypesByElement);
        }
    });
}

//////////////////////////////////
// Run initials and window load //
//////////////////////////////////

runInitials();

function runInitials() {
    initVisibleTracksCheckbox();
    initAddOptionsCheckbox();
    initFocusHandlerConnections();
    initCheckboxEnterKeyDownConnections();
    initTooltipHoverIntentConnections();
    initPlayerChanges();
    createTracklistDatabase(tracklistObjData);

    function initPlayerChanges() {
        changeConfig(configsBank.indexOf(config));
        changeNumberOfVisibleTracks(numOfVisTracks);
        changePlayerColor(playerColorsBank.indexOf(playerColor) );
        changePlaylistStyle(playlistStylesBank.indexOf(playlistStyle));
        changeInitialVolume(settedVolume);
        changeScrollElemsOpacity(scrollElemsOpacity);
        changeWheelScrollStep(wheelScrollStep);
    }
}

eventManager.addOnceEventListener(window, 'load', hidePreload);

function hidePreload() {
    console.log('page load time = ' + performance.now());

    let hidePreloadDelay = (performance.now() < 500) ? (500 - performance.now()) : 0;
    setTimeout(() => {
        preloader.classList.remove('active');
    
        eventManager.addOnceEventListener(preloader, 'transitionend', () => {
            preloader.remove();
            player.classList.add('show');

            eventManager.addOnceEventListener(player, 'animationend', () => {
                document.body.classList.remove('loading');
                player.classList.remove('show');
                player.classList.add('active');

                createPlaylist(curTracklist, true);

                let timeDelay = curTracklist.length ? 750 : 0;
                setTimeout(() => {
                    docScrollArrowsContainer.hidden = false;

                    connectKeyHandlers();
                    tracklistDatabaseAction();

                    eventManager.addOnceEventListener(tracklistDatabase, 'tracklistDtbsAnimationEnd', () => {
                        setTimeout(showLastPlayedTrackInfo, 200);
                    });
                }, timeDelay);
            });
        });
    }, hidePreloadDelay);
}
