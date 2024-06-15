import { tracklistsMapData } from './tracklists.js';
import { randomNumber, getScrollbarWidth, eventManager } from './function_storage.js';
import { configClassic } from './controls_config_classic.js';
import { configStylish } from './controls_config_stylish.js';
import { HoverIntent } from './hover_intent.js';

console.log(localStorage);
//localStorage.clear();

// Constants-anchors
const cssRoot = document.querySelector(':root');
const preloader = document.getElementById('preloader');
const audioPlayerContainer = document.getElementById('audio-player-container');
const tracklistDatabase = document.getElementById('tracklist-database');
const tracklistDtbsTitle = tracklistDatabase.querySelector('#tracklist-database-title');
const tracklistsContainer = document.getElementById('tracklists-container');
const createTracklistBtn = document.getElementById('create-tracklist');
const sortTracklistsBtn = document.getElementById('sort-tracklists');
const expandAllTrlDetailsBtn = document.getElementById('expand-all-tracklist-details');
const collapseAllTrlDetailsBtn = document.getElementById('collapse-all-tracklist-details');
const clearPlaylistBtn = document.getElementById('clear-playlist');
const tracklistDtbsBtn = document.getElementById('tracklist-database-button');
const audioPlayer = document.getElementById('audio-player');
const tooltip = document.getElementById('tooltip');
const startInfoDisplay = document.getElementById('start-info-display');
const trackTitleDisplay = document.getElementById('title-display');
const artistNameDisplay = document.getElementById('artist-display');
const curTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const timeRange = document.getElementById('time-range');
const timeLine = document.getElementById('time-line');
const timeBar = document.getElementById('time-bar');
const audioControls = document.querySelector('audio-controls');
const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');
const rewindBtn = document.getElementById('rewind');
const forwardBtn = document.getElementById('forward');
const indicator = document.getElementById('indicator');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const volumeBtn = document.getElementById('volume');
const volumeRange = document.getElementById('volume-range');
const volumeLine = document.getElementById('volume-line');
const volumeBar = document.getElementById('volume-bar');
const playlistContainer = document.getElementById('playlist-container');
const playlistLim = document.getElementById('playlist-limiter');
const visPlaylistArea = document.getElementById('visible-playlist-area');
const playlist = document.getElementById('playlist');
const playlistScrollArrowUp = document.getElementById('playlist-scroll-arrow-up');
const playlistScrollArrowDown = document.getElementById('playlist-scroll-arrow-down');
const tempTrackStorage = document.getElementById('temporary-track-storage');
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
const keysInfoWin = document.getElementById('keys-info-window');
const tracklistDelWin = document.getElementById('tracklist-deletion');
const tracklistMgrWin = document.getElementById('tracklist-manager');

// Calculated and transformed constants
const 
    initAudioPlayerContainerStyle = getComputedStyle(audioPlayerContainer),
    initTracklistDtbsStyle = getComputedStyle(tracklistDatabase),
    audioPlayerContainerPaddingBottom = parseInt(initAudioPlayerContainerStyle.paddingBottom),
    commonBorderRadius = parseInt(initAudioPlayerContainerStyle.getPropertyValue('--common-border-radius')),
    commonSpacing = parseInt(initAudioPlayerContainerStyle.getPropertyValue('--common-spacing')),
    minTracklistDtbsWidth = parseInt(initTracklistDtbsStyle.minWidth),
    maxTracklistDtbsWidth = parseInt(initTracklistDtbsStyle.maxWidth),
    settingsAreaWidth = getSettingsAreaWidth(),
    defTracklistDtbsBtnHeight = parseInt(
        getComputedStyle(tracklistDtbsBtn.parentElement).getPropertyValue('--default-height')
    ),
    siteFooterHeight = parseInt(getComputedStyle(cssRoot).getPropertyValue('--site-footer-height')),
    playlistScrollArrowBoxHeight = playlistContainer.querySelector('.playlist-scroll-arrow-box').offsetHeight,
    timeLineMrgnLeft = Math.abs(parseInt(getComputedStyle(timeLine).marginLeft)), 
    trackHeight = parseInt(getComputedStyle(playlistLim).getPropertyValue('--track-height')),
    origDocWidth = getDocWidth()
;

// Setted constants
const MAX_LOADED_AUDIOS = 5,
    TIMELINE_POSITION_STEP = 2,
    TIMELINE_UPDATE_INTERVAL = 200,
    LAG = 16.7,
    ACCELERATION_FACTOR = 5,
    ACCELERATION_DELAY = 750,
    DEFAULT_SCROLLING_TIME = 150,
    KEY_SCROLLING_TIME = 120,
    PLAYLIST_FINISH_DELAY = 500,
    HIDE_SCROLL_ELEMENTS_DELAY = 500,
    RETURN_FOCUS_DELAY = 500
;

// Constants-collections and other
const origOrderedAudios = [],
    curOrderedAudios = [],
    orderedDownloads = [],
    tooltipHoverIntentByElem = new WeakMap(),
    tracklistsExpandedState = new Map(),
    fixedCurPlaylistStrings = new Map(),
    highlightedBtns = new Map(),
    fileByFileInput = new Map(),
    cachedAudioPool = new Set(),
    activeScrollKeys = new Set(),
    activeStepAccKeys = new Set(),
    canceledStepAccKeys = new Set(),
    titleMoveTimers = {},
    trlDetailsAnimationFrameIds = {},
    animationDelays = {},
    eventEndScrollingPlaylist = new CustomEvent('endScrollingPlaylist')
;

// Variables
let scrollbarWidth = getScrollbarWidth();
let accelerateScrolling = false;
let pointerModeScrolling = false;
let activeScrollAndAlign = false;
let activeScrollOnKeyRepeat = false;
let activeScrollInPointerMode = false;
let cursorOverPlaylist = false;
let scrollablePlaylist = false;
let scrollElemsDisplaying = false;
let playOn = false;
let timePosSeeking = false;
let timeRangeEnter = false;
let timeLinePos = 0;
let timerTimeLineUpd = null;
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
let savedActiveElem = null;
let playlistLimScrollDirection = null;
let playlistLimScrollTop = 0;
let curAccelerateKey = null;
let acceleratePlaying = true;
let acceleration = false;
let accelerationType = 'none';
let removingTracksNum = 0;
let userInitiatedFocus = true;

defineProperty('selectedAudio', undefined);

function defineProperty(propertyName, audio) {
    Object.defineProperty(window, propertyName, {
        get() {
            return audio;
        },
        set(newAudio) {
            if (propertyName !== 'selectedAudio') return;

            if (audio && audio.hasAttribute('data-removed') && audio !== newAudio) {
                clearAudioCache(audio);
                audio.parentElement.remove();
            }
            
            audio = newAudio;
        }
    });
}

const DEFAULTS_DATA = {
    'cover-source': 'img/def_covers/no_cover_2.png',
    'visible-tracks__classic-config': 8,
    'visible-tracks__stylish-config': 6,
    'audio-player-volume': 0.75,
    'scroll-elements-opacity': 70,
    'wheel-scroll-step': 2
};

const executeTaskHoverIntentStrategies = {
    'time-range': executeTimeRangeTask,
    'volume-range': executeVolumeRangeTask
};

const accelerationData = {
    types: {
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
    },

    keys: {
        KeyA: {
            stepFunc: stepBack,
            accelerationType: 'fast-rewind',
            button: rewindBtn
        },
        KeyD: {
            stepFunc: stepForward,
            accelerationType: 'fast-forward',
            button: forwardBtn
        },
        ArrowLeft: {
            stepFunc: stepBack,
            accelerationType: 'fast-rewind',
            button: rewindBtn
        },
        ArrowRight: {
            stepFunc: stepForward,
            accelerationType: 'fast-forward',
            button: forwardBtn
        },
        PointerRewind: {
            stepFunc: stepBack,
            accelerationType: 'fast-rewind',
            button: rewindBtn
        },
        PointerForward: {
            stepFunc: stepForward,
            accelerationType: 'fast-forward',
            button: forwardBtn
        }
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

            if (value === true) {
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
                        let isTrackInfoBox = highlightActiveElem.matches('.track-info-box');
                        let isFocusedTrackInView;
                        
                        if (isTrackInfoBox) {
                            const focusedTrack = highlightActiveElem.closest('.track');
                            isFocusedTrackInView = isElementVisibleInScrollableContainer(playlistLim, focusedTrack);
                        }

                        userInitiatedFocus = false;
                        highlightActiveElem.focus({ preventScroll: highlightActiveElem === visPlaylistArea });
                        userInitiatedFocus = true;

                        if (isTrackInfoBox && !isFocusedTrackInView) {
                            const focusedTrack = highlightActiveElem.closest('.track');
                            const selectedTrack = selectedAudio.closest('.track');

                            showScrollElems();
                            scrollAndAlignPlaylist({
                                direction: focusedTrack.offsetTop < selectedTrack.offsetTop ? 'up' : 'down',
                                duration: KEY_SCROLLING_TIME,
                                hide: true
                            });
                        }

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
    tooltipHoverIntentByElem.get(timeRange).executeTask();

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
        updateTimeDisplay({ audio });
        updateDurationDisplay({ audio });
    } else {
        updateTimeDisplay({ displayStr: '??:??' });
        updateDurationDisplay({ displayStr: '??:??' });

        audio.ondurationchange = () => {
            if (audio !== selectedAudio) return;

            updateDurationDisplay({ audio });
            audio.currentTime = timeLinePos * audio.duration / timeRange.offsetWidth;

            if (acceleration) {
                clearUpdTimers();
                runUpdTimers(audio);
            } else {
                updateTimeDisplay({ audio });
            }

            tooltipHoverIntentByElem.get(timeRange).executeTask();
        };
    }

    updateTimeLine(audio);
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
                audio.playbackRate = accelerationData.types[accelerationType].playbackRate;
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

            if (audio !== selectedAudio) audio.onplaying = null;
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

                audio.onseeked = null;
            };
        }, LAG); // Audio ready state update delay
    };
}

function disconnectAudioHandlers(audio) {
    if (audio.paused) audio.onplaying = null;
    audio.onended = null;
    audio.onpause = null;
    audio.onwaiting = null;
    audio.onseeking = null;

    if (cachedAudioPool.size >= MAX_LOADED_AUDIOS) {
        let firstAudio = cachedAudioPool.values().next().value;
        clearAudioCache(firstAudio);
        hideLoading(firstAudio);
    }
}

function clearAudioCache(audio) {
    cachedAudioPool.delete(audio);
    audio.removeAttribute('src');
    audio.load();
}

function moveTitles(...titles) {
    for (let title of titles) {
        let boxWidth = audioPlayer.querySelector('.selected-track').offsetWidth;
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

/////////////////////////////////////////////
// Audio player controls - Play/Pause/Stop //
/////////////////////////////////////////////

playPauseBtn.onclick = playPauseAction;

function playPauseAction() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[0];
        if (!selectedAudio) return;

        setSelected(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        showTrackInfo(selectedAudio);
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
        updateTimeDisplay({ audio });
    }
}

function playAudio(audio) { // playOn = true
    indicator.classList.remove('active');

    if (!audio.src) {
        audio.src = audio.dataset.src;
        cachedAudioPool.add(audio);

        if (!audio.duration) showLoading(audio);
        runPlaying(audio);
    } else {
        if (audio.duration && audio.paused) {
            runPlaying(audio);
        } else if (acceleration) {
            runUpdTimers(audio);
        }
    }

    function runPlaying(audio) {
        /*if (acceleration && accelerationType === 'fast-rewind' && audio.ended === true) {
            audio.currentTime = 0;
            audio.currentTime = audio.duration;
        }*/

        audio.volume = 0;
        audio.preservesPitch = false;
        acceleratePlaying = true;

        audio.play().catch(error => {
            if (error.name !== 'AbortError') {
                console.error(error);
            }
        });
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
    playPauseBtn.classList.remove('icon-play');
    playPauseBtn.classList.add('icon-pause');
}

function setPauseState() {
    playOn = false;
    playPauseBtn.classList.remove('icon-pause');
    playPauseBtn.classList.add('icon-play');
}

///////////////////////////////////
// Audio player controls - FW/RW //
///////////////////////////////////

// Pointer step/acceleration handlers
for (let button of [rewindBtn, forwardBtn]) {
    let key = 'Pointer' + button.id[0].toUpperCase() + button.id.slice(1);

    button.onpointerdown = function(event) {
        if (event.button !== 0) return;

        this.setPointerCapture(event.pointerId);

        downKeyStepAccAction(key);
    };
    
    button.onpointerup = function() {
        upKeyStepAccAction(key);
    };

    button.oncontextmenu = (event) => {
        if (event.pointerType !== 'mouse') return false;
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
    clearTimeout(timerAccelerateAudioDelay);
    activeStepAccKeys.add(key);
    if (!selectedAudio) return;

    timerAccelerateAudioDelay = setTimeout(runAcceleration, ACCELERATION_DELAY);
}

function upKeyStepAccAction(key) {
    if (!activeStepAccKeys.size) return;

    clearTimeout(timerAccelerateAudioDelay);
    activeStepAccKeys.delete(key);

    if (activeStepAccKeys.size) {
        if (acceleration) {
            if (key === curAccelerateKey) {
                runAcceleration();
            } else {
                if (!canceledStepAccKeys.has(key)) {
                    if (!timePosSeeking) accelerationData.keys[key].stepFunc();
                } else {
                    canceledStepAccKeys.delete(key);
                }
            }
        } else {
            if (!timePosSeeking) accelerationData.keys[key].stepFunc();
            timerAccelerateAudioDelay = setTimeout(runAcceleration, ACCELERATION_DELAY);
        }
    } else {
        if (acceleration) {
            stopAcceleration();
        } else {
            if (!timePosSeeking) accelerationData.keys[key].stepFunc();
        }

        curAccelerateKey = null;
        canceledStepAccKeys.clear();
    }
}

function runAcceleration() {
    if (timerFinishPlay) return;

    canceledStepAccKeys.clear();
    activeStepAccKeys.forEach(activeKey => canceledStepAccKeys.add(activeKey));
    
    curAccelerateKey = Array.from(activeStepAccKeys)[activeStepAccKeys.size - 1];
    let keyAccType = accelerationData.keys[curAccelerateKey].accelerationType;

    if (keyAccType !== accelerationType) {
        if (acceleration) stopAcceleration();
        accelerationType = keyAccType;
        if (selectedAudio) accelerate(selectedAudio);
    }
}

function stepBack() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[curOrderedAudios.length - 1];
        if (!selectedAudio) return;

        console.log('step-rewind track selecting | ' + selectedAudio.dataset.title);
        
        setSelected(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        showTrackInfo(selectedAudio);
        return;
    }

    if (
        (selectedAudio.duration && selectedAudio.currentTime <= 3) ||
        (!selectedAudio.duration && !timeLinePos)
    ) { 
        if (!curOrderedAudios.length) return; // Playlist is cleared, selected audio is in the temporary track box

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
        timeLinePos = 0;
        
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
        timeLinePos = 0;

        keepSelectedTitleVisible(selectedAudio);
        if (selectedAudio.duration) updateTimeDisplay({ audio: selectedAudio });
        updateTimeLine(selectedAudio);
    }
}

function stepForward() {
    if (!selectedAudio) {
        selectedAudio = curOrderedAudios[0];
        if (!selectedAudio) return;

        console.log('step-forward track selecting | ' + selectedAudio.dataset.title);

        setSelected(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        showTrackInfo(selectedAudio);
        return;
    }

    if (!curOrderedAudios.length) return; // Playlist is cleared, selected audio is in the temporary track box

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
    timeLinePos = 0;

    showTrackInfo(selectedAudio, prevSelectedAudio);

    if (playOn) {
        playAudio(selectedAudio);
    } else if (acceleration) {
        runUpdTimers(selectedAudio);
    }
}

function accelerate(audio) {
    console.log(`start ${accelerationType} acceleration`);

    acceleration = true;

    let accBtn = accelerationData.types[accelerationType].button;
    accBtn.className = accelerationData.types[accelerationType].classIcons.accOn;

    clearUpdTimers();

    try {
        audio.playbackRate = accelerationData.types[accelerationType].playbackRate;
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

    clearUpdTimers();

    let accBtn = accelerationData.types[accelerationType].button;
    accBtn.className = accelerationData.types[accelerationType].classIcons.accOff;

    acceleratePlaying = true;
    acceleration = false;
    accelerationType = 'none';

    selectedAudio.playbackRate = accelerationData.types[accelerationType].playbackRate;

    updateTimeLine(selectedAudio);

    if (playOn) {
        if (selectedAudio.paused) {
            playAudio(selectedAudio);
        } else if (selectedAudio.readyState >= 3) {
            runUpdTimers(selectedAudio);
        }
    } else {
        if (selectedAudio.duration) {
            updateTimeDisplay({ audio: selectedAudio });
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

/////////////////////////////////////
// Audio player controls - Shuffle //
/////////////////////////////////////

shuffleBtn.onclick = shuffleAction;

function shuffleAction() {
    let isActive = shuffleBtn.firstElementChild.classList.toggle('active');
    setPlaylistOrder(!isActive);

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

function setPlaylistOrder(isOriginalOrder) {
    const audios = isOriginalOrder ? origOrderedAudios : curOrderedAudios;
    if (!audios.length) return;

    console.log(`${isOriginalOrder ? 'origin' : 'random'} track order`);

    if (!isOriginalOrder) shuffle(curOrderedAudios);
    curPlaylist.value = generateCurrentPlaylistText(isOriginalOrder);
}

function updateCurrentPlaylist() {
    if (curOrderedAudios.length) {
        let isActive = shuffleBtn.firstElementChild.classList.contains('active');
        curPlaylist.value = generateCurrentPlaylistText(!isActive);
    } else {
        curPlaylist.value = 'Playlist cleared';
    }
}

function generateCurrentPlaylistText(isOriginalOrder) {
    const audios = isOriginalOrder ? origOrderedAudios : curOrderedAudios;
    let curPlaylistText = `Current playlist (${isOriginalOrder ? 'origin' : 'random'} order):\n\n`;

    if (isOriginalOrder) curOrderedAudios.length = 0;

    curPlaylistText += audios.map((audio, idx) => {
        if (isOriginalOrder) curOrderedAudios.push(audio);

        let dub = audio.dataset.dub ? ` (${audio.dataset.dub})` : '';
        return `${idx + 1}. ${audio.dataset.artist} \u2013 ${audio.dataset.title}${dub}`;
    }).join('\n');

    breakLine(curPlaylistText);

    return Array.from(fixedCurPlaylistStrings.values()).join('');
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

            if (subStr.at(0) === ' ') {
                shiftLength--;
                continue;
            }

            let spaceIdx = subStr.lastIndexOf(' ');
            if (spaceIdx === -1) {
                spaceIdx = subStr.length;
                shiftLength++;
            }

            subStr = subStr.slice(0, spaceIdx) + '\n';
            fixedStr += subStr;
        }

        fixedStr += str.slice(fixedStr.length - shiftLength);
        fixedStr = fixedStr.replace(/\n\s/, '\n');
        if (str !== strings.at(-1)) fixedStr += '\n';

        fixedCurPlaylistStrings.set(str, fixedStr);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

////////////////////////////////////
// Audio player controls - Repeat //
////////////////////////////////////

repeatBtn.onclick = repeatAction;

function repeatAction() {
    const circleBackground = repeatBtn.firstElementChild;
    const repeatImg = circleBackground.firstElementChild;
    const repeatStates = ['none', 'playlist', 'track'];
    let idx = repeatStates.indexOf(repeatBtn.dataset.repeat);
    let repeat = repeatStates[idx + 1] || repeatStates[0];

    repeatBtn.setAttribute('data-repeat', repeat);

    console.log('repeat: ' + repeatBtn.dataset.repeat);

    switch (repeat) {
        case 'none':
            circleBackground.classList.remove('active');
            repeatImg.src = 'img/icons/repeat_playlist.png';
            repeatImg.alt = 'Repeat Playlist';
            break;
        case 'playlist':
            circleBackground.classList.add('active');
            repeatImg.src = 'img/icons/repeat_playlist.png';
            repeatImg.alt = 'Repeat Playlist';
            break;
        case 'track':
            circleBackground.classList.add('active');
            repeatImg.src = 'img/icons/repeat_track.png';
            repeatImg.alt = 'Repeat Track';
            break;
    }

    highlightSelected(selectedAudio);
}

////////////////////////////////////
// Audio player controls - Volume //
////////////////////////////////////

function changeVolumeAction(changeType, keyRepeat) {
    if (changeType !== 'increase' && changeType !== 'reduce') return;

    if (settedVolume && !keyRepeat) savedVolume = settedVolume;

    const step = 2;
    let xPos = settedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);
    xPos += changeType === 'increase' ? step : -step;
    let volumePos = moveVolumeAt(xPos);
    setVolume(volumePos);

    showVolumeIcon(settedVolume);
    volumeBar.classList.toggle('active', settedVolume);
    
    tooltipHoverIntentByElem.get(volumeRange).executeTask();
    highlightSelected(selectedAudio);
}

volumeBtn.onclick = volumeAction;

function volumeAction() {
    let isActive = volumeBtn.classList.contains('active');
    if (isActive) savedVolume = settedVolume;
    
    let xPos = isActive ? 0 : savedVolume * (volumeRange.offsetWidth - volumeBar.offsetWidth);
    let volumePos = moveVolumeAt(xPos);
    setVolume(volumePos);

    showVolumeIcon(settedVolume);
    volumeBar.classList.toggle('active', !!settedVolume);

    tooltipHoverIntentByElem.get(volumeRange).executeTask();
    highlightSelected(selectedAudio);
}

volumeRange.onclick = null;

volumeRange.oncontextmenu = () => {
    if (isTouchDevice) return false;
}

volumeRange.onpointerdown = function(event) {
    if (event.pointerType === 'mouse' && !event.target.closest('#volume-range')) return;

    if (settedVolume) savedVolume = settedVolume;

    changeVolume(event.clientX);

    volumeBar.setPointerCapture(event.pointerId);

    volumeBar.onpointermove = (event) => changeVolume(event.clientX);

    volumeBar.onpointerup = () => {
        if (!settedVolume) volumeBar.classList.remove('active');

        volumeBar.onpointermove = null;
        volumeBar.onpointerup = null;
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
    x = Math.max(x, 0);
    x = Math.min(x, volumeRange.offsetWidth - volumeBar.offsetWidth);

    volumeLine.style.width = x + volumeBar.offsetWidth / 2 + 'px';
    volumeBar.style.left = x + 'px';

    return x;
}
    
function setVolume(pos) {
    settedVolume = pos / (volumeRange.offsetWidth - volumeBar.offsetWidth);
    localStorage.setItem('audio_player_volume', settedVolume);

    if (selectedAudio) selectedAudio.volume = settedVolume;
}

function showVolumeIcon(vol) {
    volumeBtn.className = vol === 0 ? 'icon-volume-off' :
        vol <= 0.5 ? 'icon-volume-down active' :
        vol <= 0.9 ? 'icon-volume active' :
        'icon-volume-up active'
    ;
}
    
function executeVolumeRangeTask() {
    tooltip.textContent = calcVolumeTooltip();
    positionTooltip(volumeBar.getBoundingClientRect(), this.y1, 10);

    function calcVolumeTooltip() {
        return (settedVolume * 100).toFixed(0) + '%';
    }
}

//////////////////////////////////
// Track time and position info //
//////////////////////////////////

timeRange.onclick = null;

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

        this.onpointerdown = null;
        this.onpointermove = null;
        this.onpointerleave = null;
    };

    if (!selectedAudio) return;

    timeBar.hidden = false;
    timeRange.style.cursor = 'pointer';

    timeRange.onpointerdown = function(event) {
        if (event.button !== 0) return;

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

            this.onpointerup = null;
            delete this.pointerId;
        };
    };

    function moveOverTimeRange(event) {
        let x = findXPos(event.clientX);
        let timeBarPos = (x < this.offsetWidth) ? x : x - 1;

        timeBar.style.left = timeBarPos + 'px';

        if (timePosSeeking) {
            document.getSelection().empty();

            timeLinePos = x;
            updateTimePosition(x);
        }
    }

    function findXPos(clientX) {
        let x = clientX - timeRange.getBoundingClientRect().left;
        if (x < 0) x = 0;
        if (x > timeRange.offsetWidth) x = timeRange.offsetWidth;
        return x;
    }

    function updateTimePosition(xPos) {
        if (selectedAudio.duration) {
            selectedAudio.currentTime = xPos * selectedAudio.duration / timeRange.offsetWidth;
            updateTimeDisplay({ audio: selectedAudio });
        }

        updateTimeLine(selectedAudio);
    }
}

function executeTimeRangeTask() {
    if (!selectedAudio) return;

    tooltip.textContent = calcTimeRangeTooltip(this.x1);
    positionTooltip(timeBar.getBoundingClientRect(), this.y1, 5);

    function calcTimeRangeTooltip(xPos) {
        if (!selectedAudio.duration) return '??:??';
    
        let calculatedTime = xPos * selectedAudio.duration / timeRange.offsetWidth;
        if (calculatedTime < 0) calculatedTime = 0;
        if (calculatedTime > selectedAudio.duration) calculatedTime = selectedAudio.duration;
    
        let mins = Math.floor(calculatedTime / 60);
        let secs = Math.floor(calculatedTime - mins * 60);
    
        if (mins < 10) mins = '0' + mins;
        if (secs < 10) secs = '0' + secs;
    
        return calculatedTime = mins + ':' + secs;
    }
}

//////////////////////////////////////
// Updating track time and position //
//////////////////////////////////////

function updateTimeDisplay(options = {}) {
    let { audio = null, displayStr = '**:**', roundTime = false } = options;

    if (audio) {
        console.log(audio.currentTime + ' | ' + audio.dataset.title);

        let mins = roundTime ?
            Math.floor(Math.round(audio.currentTime) / 60) :
            Math.floor(audio.currentTime / 60);
        let secs = roundTime ?
            Math.round(audio.currentTime % 60) :
            Math.floor(audio.currentTime % 60);
    
        if (mins < 10) mins = '0' + mins;
        if (secs < 10) secs = '0' + secs;

        displayStr = mins + ':' + secs;
    }

    [...curTimeDisplay.children].forEach((signBox, idx) => signBox.textContent = displayStr[idx] || '');
}

function updateDurationDisplay(options = {}) {
    let { audio = null, displayStr = '**:**' } = options;

    if (audio) {
        let mins = Math.floor(audio.duration / 60);
        let secs = Math.round(audio.duration % 60);
    
        if (mins < 10) mins = '0' + mins;
        if (secs < 10) secs = '0' + secs;
    
        displayStr = mins + ':' + secs;
    }

    [...durationDisplay.children].forEach((signBox, idx) => signBox.textContent = displayStr[idx] || '');
}

function updateTimeLine(audio) {
    let timeLineWidth = audio.duration ?
        audio.currentTime / audio.duration * 100 :
        timeLinePos / timeRange.offsetWidth * 100;
    
    timeLine.style.width = `calc(${timeLineMrgnLeft}px + ${timeLineWidth}%)`;
}

function runUpdTimers(audio) {
    if (audio.duration) runUpdCurTimeDisplay(audio);
    runUpdateTimeLine(audio, !!audio.duration);
}

function runUpdCurTimeDisplay(audio) {
    updateTimeDisplay({ audio });

    let lastTime = Math.floor(audio.currentTime);

    requestCheckCurTime = requestAnimationFrame(function checkCurTime() {
        let curTime = Math.floor(audio.currentTime);

        if (curTime !== lastTime) {
            updateTimeDisplay({ audio });
            lastTime = curTime;
        }

        requestCheckCurTime = requestAnimationFrame(checkCurTime);
    });
}

function runUpdateTimeLine(audio, hasDuration) {
    const curTimeChangeStep = TIMELINE_UPDATE_INTERVAL / 1000;
    const rateFactor = acceleration ? ACCELERATION_FACTOR : 1;
    const timeLineUpdInterval = TIMELINE_UPDATE_INTERVAL / rateFactor;
    let isTrackFinished = false;
    
    timerTimeLineUpd = setInterval(() => {
        let isCurTimeChanging = hasDuration ? 
            (acceleration && (!playOn || audio.readyState < 3 || !acceleratePlaying)) : 
            acceleration
        ;
        
        if (isCurTimeChanging) {
            switch (accelerationType) {
                case 'fast-forward':
                    if (hasDuration) {
                        audio.currentTime += curTimeChangeStep;
                        isTrackFinished = audio.currentTime >= audio.duration;
                    } else {
                        timeLinePos += TIMELINE_POSITION_STEP;
                        isTrackFinished = timeLinePos >= timeRange.offsetWidth;
                    }
                    break;
                case 'fast-rewind':
                    if (hasDuration) {
                        audio.currentTime -= curTimeChangeStep;
                        isTrackFinished = audio.currentTime <= 0;
                    } else {
                        timeLinePos -= TIMELINE_POSITION_STEP;
                        isTrackFinished = timeLinePos <= 0;
                    }
                    break;
            }
            
            if (isTrackFinished) {
                console.log(`track ended in ${accelerationType} (${hasDuration ? 'no playback' : 'no duration'}) |\
                    ${audio.dataset.title}`);

                finishTrack(audio);
            }
        }
        
        updateTimeLine(audio);
    }, timeLineUpdInterval);
}

////////////////////
// Finish playing //
////////////////////

function finishTrack(audio) {
    clearUpdTimers();

    // Round the current time to the audio duration and extend the timeline over the entire range
    updateTimeDisplay({ audio, roundTime: true });
    updateTimeLine(audio);

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
                let shuffleInfo = shuffleBtn.firstElementChild.classList.contains('active') ? 'shuffle ' : '';

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
            timeLinePos = 0;
        } else if (acceleration && accelerationType === 'fast-rewind') { 
            if (selectedAudio.duration) selectedAudio.currentTime = selectedAudio.duration;
            timeLinePos = timeRange.offsetWidth;
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
    clearTimeout(timerAccelerateAudioDelay);
    if (acceleration) stopAcceleration();

    scrollEndStates.curPlaylist = false;
    scrollEndStates.document = false;

    timerFinishPlay = setTimeout(() => {
        stopAccelerationAndClear();

        trackTitleDisplay.textContent = '';
        artistNameDisplay.textContent = '';

        updateTimeDisplay({ displayStr: '--:--' });
        updateDurationDisplay({ displayStr: '--:--' });

        tooltipHoverIntentByElem.get(timeRange).dismissTask();
        timePosSeeking = false;
        timeLine.style.width = timeLineMrgnLeft + 'px';
        timeRange.style.cursor = '';
        timeBar.hidden = true;
        timeRange.onpointerdown = null;
        timeRange.onpointerup = null;
        if (timeRange.pointerId) {
            timeRange.releasePointerCapture(timeRange.pointerId);
            delete timeRange.pointerId;
        }

        selectedAudio.currentTime = 0;
        timeLinePos = 0;
        
        disconnectAudioHandlers(selectedAudio);
        removeSelected(selectedAudio);
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
            if (curPlaylist !== highlightActiveElem) curPlaylist.blur();
    
            if (isScrollAndAlignPlaylistActive) {
                eventManager.addOnceEventListener(document, 'endScrollingPlaylist', resetScrollbarPositions);
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
    
        if (curPlaylist.scrollTop) {
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
    
        if (window.scrollY) {
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
    clearInterval(timerTimeLineUpd);
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

//////////////
// Playlist //
//////////////

visPlaylistArea.onpointerover = (event) => {
    if (!event.target.hasAttribute('data-actionable')) return;

    let track = event.target.closest('.track');
    let relTarget = event.relatedTarget;
    if (track.contains(relTarget) && relTarget.hasAttribute('data-actionable')) return;

    let actionableElems = Array.from(track.querySelectorAll('.artist-name, .track-title'));

    playlist.hoveredTrackInfo = actionableElems;

    actionableElems.forEach(elem => {
        elem.classList.add('hover');
        elem.parentElement.classList.add('visible');
    });

    adjustTrackInfoLimitersWidth(actionableElems);

    track.addEventListener('pointerout', function removeHovers(event) {
        let relTarget = event.relatedTarget;
        if (actionableElems.includes(relTarget)) return;
        
        actionableElems.forEach(elem => {
            elem.classList.remove('hover');
            elem.parentElement.classList.remove('visible');
        });

        if (!removingTracksNum) playlistLim.style.width = '';

        delete playlist.hoveredTrackInfo;

        track.removeEventListener('pointerout', removeHovers);
    });
};

function adjustTrackInfoLimitersWidth(actionableElems) {
    if (removingTracksNum) return;

    let maxTrackInfo = actionableElems.reduce(
        (maxElem, elem) => maxElem.offsetWidth > elem.offsetWidth ? maxElem : elem
    );
    
    let maxTrackInfoLeft = maxTrackInfo.getBoundingClientRect().left + window.scrollX;
    let playlistLimLeft = playlistLim.getBoundingClientRect().left + window.scrollX;
    let maxTrackInfoLim = maxTrackInfo.parentElement;
    let maxTrackInfoWidth = maxTrackInfo.offsetWidth;
    let playlistWidth = playlist.offsetWidth;

    if (maxTrackInfoLeft - playlistLimLeft + maxTrackInfoWidth + commonSpacing <= playlistWidth) {
        playlistLim.style.width = '';
        return;
    }

    let docWidth = getDocWidth();
    let shift = isTouchDevice ? 1 : 0; // Bug on some mobile devices

    if (maxTrackInfoLim.hasAttribute('data-animating')) {
        playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';

        eventManager.addOnceEventListener(maxTrackInfoLim, 'transitionend', () => {
            if (maxTrackInfo.classList.contains('hover')) {
                if (maxTrackInfoLim.classList.contains('visible')) {
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
        maxTrackInfoLeft = maxTrackInfo.getBoundingClientRect().left + window.scrollX;
        maxTrackInfoWidth = maxTrackInfo.offsetWidth;

        if (maxTrackInfoLeft - playlistLimLeft + maxTrackInfoWidth + commonSpacing > playlistWidth) {
            playlistLim.style.width = maxTrackInfoLeft - playlistLimLeft + maxTrackInfoWidth + commonSpacing + 'px';
        }
        if (maxTrackInfoLeft + maxTrackInfoWidth + commonSpacing > docWidth) {
            playlistLim.style.width = docWidth - playlistLimLeft - shift + 'px';
        }
    }
}

// Playlist focus and text select handlers
visPlaylistArea.addEventListener('pointerdown', function (event) {
    let outOfVisibleArea = event.clientX > this.getBoundingClientRect().right;
    if (outOfVisibleArea) preventFocus(this);

    if (event.pointerType === 'mouse' && event.button === 1) return;

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
                let maxTrackInfo = event.target;
                maxTrackInfo.style.userSelect = 'none';

                document.addEventListener('pointerup', () => maxTrackInfo.style.userSelect = '', {once: true});
            }
        } else { // Focus handling
            if (document.activeElement === trackInfoBox) {
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
        selectPlaylistTrack(track);
    }

    // Remove track button
    if (event.target.closest('.remove-track')) {
        let track = event.target.closest('.track');
        removeTrackFromPlaylist(track, event.type);
    }
};

function selectPlaylistTrack(track) {
    if (document.getSelection().toString().length) return;

    let newAudio = track.querySelector('audio');

    console.log('playlist track selecting | ' + newAudio.dataset.title);

    setPlayState();
    
    if (!selectedAudio) {
        selectedAudio = newAudio;

        setSelected(selectedAudio);
        if (timeRangeEnter) enterTimeRange();
        showTrackInfo(selectedAudio);
        playAudio(selectedAudio);
        return;
    }

    clearFinPlayTimer();

    if (newAudio !== selectedAudio) {
        clearUpdTimers();
    
        if (playOn) pauseAudio(selectedAudio);
    
        let prevSelectedAudio = selectedAudio;

        removeSelected(prevSelectedAudio);
        selectedAudio = newAudio;
        setSelected(selectedAudio);

        prevSelectedAudio.currentTime = 0;
        selectedAudio.currentTime = 0;
        timeLinePos = 0;
    
        showTrackInfo(selectedAudio, prevSelectedAudio);
    } else {
        selectedAudio.currentTime = 0;
        timeLinePos = 0;

        showTrackInfo(selectedAudio, selectedAudio);
    }

    playAudio(selectedAudio);
}

function removeTrackFromPlaylist(track, eventType = null) {
    if (track.classList.contains('removing')) return;

    removingTracksNum++;

    if (scrollablePlaylist) showScrollElems();

    let docWidth = getDocWidth();
    let playlistLimLeft = playlistLim.getBoundingClientRect().left + window.scrollX;
    playlistLim.style.width = docWidth - playlistLimLeft + 'px';
    
    // If a track is being added, set the current property values when starting the removal animation
    if (track.classList.contains('not-ready')) {
        let trackStyle = getComputedStyle(track);
        let transformMatrix = trackStyle.transform;
        // transformMatrix ==> 'matrix(scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY())'
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
        let audio = track.querySelector('audio');

        console.log('remove track from playlist | ' + audio.dataset.title);

        removingTracksNum--;

        // If focused elem === track title => set focus on another elem
        let trackInfoBox = track.querySelector('.track-info-box');

        if (eventType === 'keydown' && document.activeElement === trackInfoBox) {
            let nextTrack = track.nextElementSibling || track.previousElementSibling;
            let nextFocusedElem = nextTrack ?
                nextTrack.querySelector('.track-info-box') :
                tracklistsContainer.querySelector('.tracklist-section');

            if (
                !settingsArea.hidden &&
                selectedAudio &&
                audio !== selectedAudio &&
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
        playlistTracksData.splice(origIdx, 1);

        let curIdx = curOrderedAudios.indexOf(audio);
        curOrderedAudios.splice(curIdx, 1);

        // Removing track element from playlist
        if (audio === selectedAudio) {
            track.classList.remove('removing');
            audio.setAttribute('data-removed', '');
            tempTrackStorage.appendChild(track);
        } else {
            if (cachedAudioPool.has(audio)) clearAudioCache(audio);
            track.remove();
        }

        // Recounting duplicates
        let artist = audio.dataset.artist;
        let title = audio.dataset.title;

        for (let i = origIdx; i < playlistTracksData.length; i++) {
            let trackData = playlistTracksData[i];
            let comparedArtist = trackData.artist;
            let comparedTitle = trackData.title;

            if (comparedArtist === artist && comparedTitle === title) {
                const audio = playlist.children[i].querySelector('audio');
                const trackTitle = playlist.children[i].querySelector('.track-title');
                let dub = trackData.dub;
                if (!dub) {
                    console.error('Duplicate attribute is missing', trackData.artist + ' - ' + trackData.title);
                    continue;
                }

                dub--;

                if (dub > 1) {
                    trackData.dub = dub;
                    audio.dataset.dub = dub;
                    trackTitle.textContent = `${title} (${dub})`;
                } else {
                    delete trackData.dub;
                    delete audio.dataset.dub;
                    trackTitle.textContent = title;
                }
            }
        }

        // Cutting string from curPlaylist textarea
        updateCurrentPlaylist();

        // Last removed track
        if (!removingTracksNum) {
            // Save current tracklist
            localStorage.setItem('playlist_tracks_data', encodeURIComponent(JSON.stringify(playlistTracksData)));

            // Change the playlist limiter width to default value
            if (playlist.hoveredTrackInfo) {
                adjustTrackInfoLimitersWidth(playlist.hoveredTrackInfo);
            } else {
                playlistLim.style.width = '';
            }

            // Highlight selected audio
            if (highlightActiveElem || eventType !== 'keydown') highlightSelected(selectedAudio);

            // Hide scroll elements after a while and align playlist (bug)
            stopScrolling(KEY_SCROLLING_TIME);

            // Trigger for adding track animation
            document.dispatchEvent(new CustomEvent('endTracksRemoving'));
        }

        checkPlaylistScrollability();
        checkScrollElementsVisibility();
    });
}

visPlaylistArea.oncontextmenu = function(event) {
    if (!event.target.hasAttribute('data-actionable')) return;

    event.preventDefault();

    document.getSelection().empty();

    let trackMenu = document.createElement('div');
    trackMenu.className = 'track-menu';
    audioPlayer.appendChild(trackMenu);
    
    let downloadLink = document.createElement('div');
    downloadLink.className = 'menu-item';
    downloadLink.textContent = 'Save audio as MP3';
    trackMenu.appendChild(downloadLink);

    let audioPlayerRect = audioPlayer.getBoundingClientRect(); // audioPlayer - parent element for trackMenu

    let x = event.clientX - audioPlayerRect.left;
    if (x > (document.documentElement.clientWidth - audioPlayerRect.left - trackMenu.offsetWidth)) {
        x = document.documentElement.clientWidth - audioPlayerRect.left - trackMenu.offsetWidth;
    }
    trackMenu.style.left = x + 'px';

    let y = event.clientY - audioPlayerRect.top;
    if (y > (document.documentElement.clientHeight - audioPlayerRect.top - trackMenu.offsetHeight)) {
        y = document.documentElement.clientHeight - audioPlayerRect.top - trackMenu.offsetHeight;
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
        status.textContent = 'Waiting for loading...';
        progress.appendChild(status);

        let displayProgress = document.createElement('div');
        displayProgress.className = 'display-progress';
        displayProgress.textContent = '0%';
        loadInfo.appendChild(displayProgress);

        let url = audio.dataset.src;
        let response = await fetch(url);
    
        if (response.ok) {
            status.textContent = 'Loading...';

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
                displayProgress.textContent = Math.floor(receivedPercent) + '%';
            }

            if (receivedLength === contentLength) status.textContent = 'Complete download!';

            let audioBlob = new Blob([binaryData], {type: 'audio/mpeg'});
            let audioName = audio.dataset.artist + ' - ' + audio.dataset.title + '.mp3';

            orderedDownloads.push(() => saveFile(audioBlob, audioName));
            if (orderedDownloads.length === 1) orderedDownloads[0]();

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

                if (supportsFileSystemAccess) { // File System Access API поддерживается
                    try {
                        // Показать диалог сохранения файла.
                        let handle = await window.showSaveFilePicker({
                            suggestedName: fileName
                        });
                        
                        // Записать blob в файл.
                        let writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();

                        status.textContent = 'Audio file is saved!';
                        hideLoadStatus();
                    } catch (err) {
                        console.error(err.name + ': ' + err.message);

                        if (err.name === 'AbortError') { // Отмена скачивания файла, не предлагать второй вариант
                            status.textContent = 'Audio file saving canceled';
                            hideLoadStatus();
                        }

                        if (err.name === 'SecurityError') {
                            console.log('File System Access API не работает при длительной загрузке файла. ' + 
                                'Осуществлён метод загрузки через ссылку.');
                        }
                    }
                } else {
                    // Доступ API к файловой системе не поддерживается или ошибка в процессе => Загрузка через ссылку
                    let audioLink = document.createElement('a');
                    audioLink.download = fileName;
                    audioLink.href = URL.createObjectURL(blob);
                    audioLink.click();
                    URL.revokeObjectURL(audioLink.href);

                    eventManager.addOnceEventListener(window, 'focus', hideLoadStatus);
                }
            }
        } else {
            alert("Download error! Response status: " + response.status);

            status.textContent = 'Download failed';
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
        }
    }
};

////////////////////////
// Playlist scrolling //
////////////////////////

playlistLim.onscroll = () => {
    playlistLimScrollDirection = playlistLim.scrollTop > playlistLimScrollTop ? 'down' : 'up';
    playlistLimScrollTop = playlistLim.scrollTop;
};

playlistContainer.onpointerenter = () => {
    cursorOverPlaylist = true;

    if (!scrollablePlaylist) return;

    clearTimeout(timerHideScrollElems);
    checkReachingPlaylistBoundaries('all');
    showScrollElems();

    let activeElem = document.activeElement;
    let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
    let isDocScrollbar = isDocScrollbarCheck();

    if (!accelerateScrolling) return;
    if (!isDocScrollbar) return;
    if (activeElem === visPlaylistArea) return;
    if (activeElem !== visPlaylistArea && !activeElem.matches('.tracklist-section') &&
        activeElem.scrollHeight > activeElem.clientHeight) return;
    if (activeElem.matches('input[type="number"]') && (key === 'ArrowUp' || key === 'ArrowDown')) return;
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
        if (activeElem === visPlaylistArea) return;

        let isDocScrollbar = isDocScrollbarCheck();
        let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
        let direction = scrollingKeysData[key].direction;
        let isReachingLimits = checkReachingPlaylistBoundaries(direction);
        let isProhibitedActiveElem = 
            (activeElem.matches('input[type="number"]') && (key === 'ArrowUp' || key === 'ArrowDown')) ||
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
        if (activeElem !== document.body) return;
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
    if (event.pointerType === 'mouse' && event.button !== 1) return;
    if (isTouchDevice && !event.isPrimary) return;
    if (!scrollablePlaylist) return;
    if (pointerModeScrolling) return;
    let outOfVisibleArea = event.clientX > this.getBoundingClientRect().right;
    if (outOfVisibleArea) return;
    event.preventDefault();

    document.getSelection().empty();

    this.setPointerCapture(event.pointerId);

    if (event.pointerType === 'mouse') {
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
    
            // if pointermove was caused by the dispatchEvent method => event.clientY === null
            currentY = event.clientY || lastCurrentY;
    
            if (currentY <= centerY - sensingDistance) {
                direction = 'up';

                if (event.pointerType === 'mouse') {
                    document.body.classList.remove('scroll-down');
                    document.body.classList.add('scroll-up');
                }
            } else if (currentY >= centerY + sensingDistance) {
                direction = 'down';

                if (event.pointerType === 'mouse') {
                    document.body.classList.remove('scroll-up');
                    document.body.classList.add('scroll-down');
                }
            } else {
                direction = null;

                if (event.pointerType === 'mouse') {
                    document.body.classList.remove('scroll-up');
                    document.body.classList.remove('scroll-down');
                }
            }
    
            if ( // Scrolling in progress
                (direction === 'up' && playlistLim.scrollTop > 0) ||
                (direction === 'down' && playlistLim.scrollHeight - playlistLim.scrollTop > playlistLim.clientHeight)
            ) {
                requestScrollInPointerMode = requestAnimationFrame(function scrollInPointerMode() {
                    if (!activeScrollInPointerMode) {
                        cancelAnimationFrame(requestAligningScroll);
                        activeScrollAndAlign = false;
                        activeScrollInPointerMode = true;
                    }
            
                    let range = 200;
                    let maxDeltaHeight = playlistLim.scrollHeight / 30;
                    if (maxDeltaHeight < 40) maxDeltaHeight = 40;
                    let maxSpeed = 1;
                    let minSpeed = maxSpeed / maxDeltaHeight;
                    let y = Math.abs(centerY - currentY) - sensingDistance;
                    let speed = minSpeed + (maxSpeed - minSpeed) * (y / range) ** 3;
                    if (speed > maxSpeed) speed = maxSpeed;
                    deltaHeight = maxDeltaHeight * speed;
            
                    playlistLim.scrollTop += (direction === 'down') ? deltaHeight :
                        (direction === 'up') ? -deltaHeight : 0;
            
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

        if (event.pointerType === 'mouse') {
            eventManager.addOnceEventListener(document, 'pointerdown', cancelPointerModeScrolling);
        } else if (isTouchDevice) {
            eventManager.addOnceEventListener(this, 'pointerup', cancelPointerModeScrolling);
        }
        
        function cancelPointerModeScrolling(event) {
            console.log('pointer mode scrolling off');
            
            if (event.pointerType === 'mouse' && event.button === 1) {
                event.preventDefault();
            }
    
            // Before pointerModeScrolling === false to prevent additional alignment
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
    
            if (event.pointerType === 'mouse') {
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
    eventManager.removeOnceEventListener(document, 'endScrollingPlaylist', 'scrollAndAlignDocument');

    scrollEndStates.curPlaylist = false; // Gotta be close to scrollEndStates.document

    let isPlaylistInView = isPlaylistInViewCheck();
    if (!isPlaylistInView) {
        scrollEndStates.document = false;

        if (isScrollAndAlignPlaylistActive) {
            eventManager.addOnceEventListener(document, 'endScrollingPlaylist', scrollAndAlignDocument);
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
    
        if (y !== initScrolled) {
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

    if (activeScrollKeys.size === 1) {
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
    if (activeElem !== visPlaylistArea && !activeElem.matches('.tracklist-section') &&
        activeElem.scrollHeight > activeElem.clientHeight) return false;
    if (activeElem.matches('input[type="number"]') && (key === 'ArrowUp' || key === 'ArrowDown')) return false;

    let isDocScrollbar = isDocScrollbarCheck();

    if (isDocScrollbar) {
        if (
            activeElem === visPlaylistArea ||
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
            align: (key === 'Home' || key === 'End') ? false : true,
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

    let deltaHeight = (key === 'Home' || key === 'End') ?
        playlistLim.scrollHeight / 10 :
        scrollingKeysData[key].factor * 10;

    playlistLim.scrollTop += (direction === 'down') ? deltaHeight : ((direction === 'up') ? -deltaHeight : 0);

    isReachingLimits = checkReachingPlaylistBoundaries(direction);
    if (isReachingLimits && !playlist.hasAttribute('adding-tracks')) {
        finalizeScrolling();
        return;
    }

    function finalizeScrolling() {
        activeScrollOnKeyRepeat = false;
        document.dispatchEvent(eventEndScrollingPlaylist);
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
                !(activeElem.matches('input[type="number"]') && (key === 'ArrowUp' || key === 'ArrowDown'))
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
    
    let remainderRatio = remainder / trackHeight;

    if (remainderRatio && align) {
        let k = wheel ? 1 : 0;

        if (direction === 'down') {
            deltaHeight += trackHeight * (k + 1 - remainderRatio);
        }
        if (direction === 'up') {
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
    
        if (direction === 'down') {
            playlistLim.scrollTop = initScrolled + deltaHeight * progress;
        }
        if (direction === 'up') {
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
            document.dispatchEvent(eventEndScrollingPlaylist);

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
    let isTopBoundaryReached = playlistLim.scrollTop === 0;
    playlistScrollArrowUp.classList.toggle('inactive', isTopBoundaryReached);

    let isBottomBoundaryReached = playlistLim.scrollHeight - playlistLim.scrollTop <= playlistLim.clientHeight;
    playlistScrollArrowDown.classList.toggle('inactive', isBottomBoundaryReached);

    return (isTopBoundaryReached && direction === 'up') || (isBottomBoundaryReached && direction === 'down');
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
    const isScrollable = playlistLim.scrollHeight > playlistLim.clientHeight;
    if (scrollablePlaylist === isScrollable) return;
    
    scrollablePlaylist = isScrollable;
    playlistContainer.classList.toggle('scrollable', isScrollable);
    
    checkReachingPlaylistBoundaries('all');
    
    if (isScrollable) {
        if (cursorOverPlaylist || pointerModeScrolling) showScrollElems();
    } else {
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
    void track.offsetWidth; // Causes reflow
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
        let actionableElems = Array.from(track.querySelectorAll('.artist-name, .track-title'));
        let isHovered = false;

        actionableElems.forEach(trackInfo => {
            let trackInfoLim = trackInfo.parentElement;
            trackInfoLim.setAttribute('data-animating', '');
            if (!isHovered && trackInfo.classList.contains('hover')) isHovered = true;
    
            eventManager.addOnceEventListener(trackInfoLim, 'transitionend', () => {
                trackInfoLim.removeAttribute('data-animating');
            });
        });

        if (isHovered) adjustTrackInfoLimitersWidth(actionableElems);
    }
}

/////////////////////////////////
// Audio player footer buttons //
/////////////////////////////////

configBtn.onclick = (event) => {
    changeAudioControlsConfiguration.eventType = event.type;
    let configIdx = configsBank.indexOf(config);
    changeAudioControlsConfiguration(configIdx + 1);
}

colorBtn.onclick = () => {
    let colorIdx = audioPlayerColorsBank.indexOf(audioPlayerColor);
    changeAudioPlayerColor(colorIdx + 1);
};

playlistStyleBtn.onclick = () => {
    let styleIdx = playlistStylesBank.indexOf(playlistStyle);
    changePlaylistStyle(styleIdx + 1);
};

settingsBtn.onclick = settingsAction;

keysInfoBtn.onclick = showKeysInfo;

///////////////////////////////////////////////
// Side button (tracklist databse show/hide) //
///////////////////////////////////////////////

function calcTracklistDtbsBtnPosition() {
    const minTracklistDtbsBtnHeight = 50;
    const tracklistDtbsBtnCont = tracklistDtbsBtn.parentElement;
    let tracklistDtbsBtnHeight = defTracklistDtbsBtnHeight;
    let winHeight = getWinHeight();
    let audioPlayerRect = audioPlayer.getBoundingClientRect();
    let audioPlayerScrolled = (audioPlayerRect.top < 0) ? Math.abs(audioPlayerRect.top) : 0;
    let audioPlayerTop = Math.max(audioPlayerRect.top, 0);
    let audioPlayerBottom = (audioPlayerRect.bottom > winHeight) ? winHeight : audioPlayerRect.bottom;
    let visAudioPlayerHeight = audioPlayerBottom - audioPlayerTop;

    if (tracklistDtbsBtnHeight > visAudioPlayerHeight - commonBorderRadius * 2) {
        tracklistDtbsBtnHeight = visAudioPlayerHeight - commonBorderRadius * 2;

        if (tracklistDtbsBtnHeight < minTracklistDtbsBtnHeight) {
            tracklistDtbsBtnHeight = minTracklistDtbsBtnHeight;

            if (visAudioPlayerHeight < minTracklistDtbsBtnHeight + commonBorderRadius * 2) {
                let tracklistDtbsBtnTop = audioPlayer.offsetHeight - tracklistDtbsBtnHeight - commonBorderRadius;
                tracklistDtbsBtnCont.style.top = tracklistDtbsBtnTop + 'px';
            }
        } else {
            tracklistDtbsBtnCont.style.top = audioPlayerScrolled + commonBorderRadius + 'px';
        }

        tracklistDtbsBtnCont.style.height = tracklistDtbsBtnHeight + 'px';
    } else {
        let tracklistDtbsBtnTop = audioPlayerScrolled + visAudioPlayerHeight / 2 - tracklistDtbsBtnHeight / 2;
        tracklistDtbsBtnCont.style.top = tracklistDtbsBtnTop + 'px';
        tracklistDtbsBtnCont.style.height = '';
    }
}

tracklistDtbsBtn.onclick = tracklistDatabaseAction;

function tracklistDatabaseAction() {
    if (!tracklistDelWin.hidden) return;
    if (!tracklistMgrWin.hidden) return;

    let audioPlayerMoveInfo;

    if (
        tracklistDatabase.hasAttribute('data-resizing') ||
        settingsArea.hasAttribute('data-await-run-hide-settings') ||
        settingsArea.hasAttribute('data-waiting-action') ||
        tracklistsContainer.hasAttribute('data-toggling-details') ||
        tracklistDatabase.classList.contains('updating') ||
        (
            audioPlayerMoveInfo = JSON.parse(audioPlayer.getAttribute('data-move-info')),
            audioPlayerMoveInfo && audioPlayerMoveInfo.moving && audioPlayerMoveInfo.trigger === 'settingsArea'
        )
    ) {
        tracklistDatabase.setAttribute('data-waiting-action', '');
        return;
    }

    let isTracklistDtbsStickedLeft = tracklistDatabase.classList.contains('sticked-left');
    let isTracklistDtbsMoved = tracklistDatabase.hasAttribute('data-moving');
    let audioPlayerLeft = audioPlayer.getBoundingClientRect().left + window.scrollX;

    resetTracklistDtbsAndAudioPlayerStates();
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

            calcTracklistsTextIndent();
            calcTracklistsContainerMaxHeight();
            disableTracklistsContainerScrollBar();
            checkAudioPlayerContainerJustify();
            checkGlobalStates();
    
            let tracklistDtbsLeft = audioPlayerLeft - tracklistDatabase.offsetWidth;
            let noSpaceForMoving = tracklistDtbsLeft === 0 ? true : false;
    
            if (isTracklistDtbsStickedLeft && !noSpaceForMoving) { // Move tracklists
                moveTracklistDatabase();
            } else { // Show tracklists
                toggleTracklistDatabaseVisibility('show');
            }
        } else { // Hide tracklists/move audio player
            if (tracklistDatabase.classList.contains('active')) { // Hide tracklists
                disableTracklistsContainerScrollBar();
                toggleTracklistDatabaseVisibility('hide');
            } else {
                if (isTracklistDtbsMoved) { // Cancel tracklists moving animation (move audio player)
                    moveAudioPlayer();
                } else { // Cancel tracklists hiding animation (show tracklists)
                    toggleTracklistDatabaseVisibility('show');
                }
            }
        }
    }
            
    function moveTracklistDatabase() {
        tracklistDatabase.setAttribute('data-moving', '');

        let curTracklistDtbsWidth = tracklistDatabase.offsetWidth;
        let tracklistDtbsLeft = audioPlayerLeft - curTracklistDtbsWidth;

        tracklistDatabase.style.width = curTracklistDtbsWidth + 'px'; 
        tracklistDatabase.style.marginLeft = tracklistDtbsLeft + 'px';
        void tracklistDatabase.offsetWidth; // Causes a reflow
        tracklistDatabase.classList.add('smooth-moving');
        setTimeout(() => tracklistDatabase.style.marginLeft = '');

        eventManager.addOnceEventListener(tracklistDatabase, 'transitionend', endSmoothMoving);
    }

    function moveAudioPlayer() {
        audioPlayer.setAttribute('data-move-info', '{"moving": true, "trigger": "tracklistDatabase"}');

        tracklistDatabase.classList.remove('enabled');

        audioPlayerContainer.style.minHeight = '';
        setDocScrollbarYWidth();

        audioPlayer.style.marginLeft = audioPlayerLeft + 'px';
        void audioPlayer.offsetWidth; // Causes a reflow
        audioPlayer.classList.add('smooth-moving');
        audioPlayer.style.marginLeft = (canAutoChangeWidth && !settingsArea.hidden) ?
            origDocWidth - settingsAreaWidth - audioPlayer.offsetWidth + 'px' :
            '';

        eventManager.addOnceEventListener(audioPlayer, 'transitionend', endSmoothMoving);
    }

    function endSmoothMoving() {
        resetTracklistDtbsAndAudioPlayerStates();
        checkGlobalStates();

        if (tracklistDatabase.classList.contains('enabled')) { // Tracklists ends moving => Show tracklists
            tracklistDatabase.removeAttribute('data-moving');

            scrollDoc('left', 'smooth');
            checkPendingSettingsAction();
            toggleTracklistDatabaseVisibility('show');
        } else { // Audio player ends moving => End animations
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
            checkAudioPlayerContainerJustify();
        }
    }

    function resetTracklistDtbsAndAudioPlayerStates() {
        tracklistDatabase.removeAttribute('data-moving');
        audioPlayer.removeAttribute('data-move-info');

        tracklistDatabase.style.width = '';
        tracklistDatabase.style.marginLeft = '';
        audioPlayer.style.marginLeft = '';

        tracklistDatabase.classList.remove('smooth-moving');
        audioPlayer.classList.remove('smooth-moving');

        eventManager.removeOnceEventListener(tracklistDatabase, 'transitionend', 'endSmoothMoving');
        eventManager.removeOnceEventListener(audioPlayer, 'transitionend', 'endSmoothMoving');
        eventManager.removeOnceEventListener(document, 'scrollend', 'checkPendingSettingsAction');

        let firstAnimatedElem = tracklistDtbsTitle;
        let lastAnimatedElem = [...tracklistDatabase.querySelectorAll('.add-controls button')].pop();
        [firstAnimatedElem, lastAnimatedElem].forEach(elem => {
            eventManager.clearEventHandlers(elem, 'transitionstart', 'transitionend');
        });
    }

    function toggleTracklistDatabaseVisibility(animationAction) {
        tracklistDatabase.classList.toggle('active', animationAction === 'show');
        if (animationAction === 'hide') tracklistDatabase.removeAttribute('data-ready');
        
        let visTracklistSections = filterVisibleTracklistSections();
        let addControlsBtns = Array.from(tracklistDatabase.querySelectorAll('.add-controls button'));
        let animatedElems = [].concat(tracklistDtbsTitle, visTracklistSections, addControlsBtns);
        if (animationAction === 'hide') animatedElems.reverse();
        let animElemsNum = animatedElems.length;
        let controlsNum = addControlsBtns.length;
        let endAnimFunc = (animationAction === 'show') ? endShowAnimation : endHideAnimation;
        let args = [animatedElems, animElemsNum, controlsNum, animationAction, endAnimFunc];

        animateElements(...args);
    }

    function filterVisibleTracklistSections() {
        return [].filter.call(tracklistsContainer.children,
            tracklistSection => isElementVisibleInScrollableContainer(tracklistsContainer, tracklistSection));
    }

    async function animateElements(animatedElems, animElemsNum, controlsNum, animationAction, endAnimFunc) {
        let firstIteration = true;

        for (let i = 0; i < animElemsNum; i++) {
            if (i === 0 && !tracklistDatabase.hasAttribute('data-animating')) {
                setAnimationStart(animatedElems[i]);
            }

            if (i === animElemsNum - 1) {
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
                return (i === 0 || k) ? 0 : (i === n - m) ? 250 : (i === 1) ? 200 : 100;
            } else {
                return (i === 0 || k) ? 0 : (i === n - 1) ? 200 : (i === m) ? 250 : 100;
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

    function toggleShowClassWithoutAnimation(animationAction) {
        let totalTracklists = tracklistsContainer.children.length;

        return !totalTracklists ? true : new Promise((resolve, reject) => {
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
    
                        if (curActiveState === startActiveState) {
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
                } while (i % batchSize !== 0 && i < totalTracklists);
    
                if (i >= totalTracklists) {
                    tracklistDatabase.removeAttribute('data-optimizing');
                    enableTransitionAnimations();
                    resolve();
                }
            }

            function disableTransitionAnimations() {
                tracklistsContainer.classList.add('no-animation');
                void tracklistsContainer.offsetHeight; // Causes a reflow 
            }

            function enableTransitionAnimations() {
                void tracklistsContainer.offsetHeight; // Causes a reflow
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

        tracklistDatabase.setAttribute('data-ready', '');

        tracklistDtbsBtn.classList.remove('waiting');
        tracklistDtbsBtn.classList.add('enabled');

        enableTracklistsContainerScrollBar();
        checkPendingSettingsAction();
        checkStartInfoDisplaying();
    }

    async function endHideAnimation(animationAction) {
        let isFinished = await toggleShowClassWithoutAnimation(animationAction);
        if (!isFinished) return;

        if (tracklistDatabase.offsetHeight > audioPlayer.offsetHeight && window.scrollY) {
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
                moveAudioPlayer();
            } else {
                tracklistDatabase.classList.remove('enabled');
                tracklistDtbsBtn.classList.remove('waiting');
                tracklistDtbsBtn.classList.remove('enabled');

                audioPlayerContainer.style.minHeight = '';

                checkGlobalStates();
                checkStartInfoDisplaying();
            }
        }
    }

    function disableTracklistsContainerScrollBar() {
        tracklistsContainer.style.paddingRight = '';
        
        if (tracklistsContainer.classList.contains('scrollable')) {
            tracklistsContainer.style.overflow = 'hidden';

            if (!canAutoChangeWidth) {
                let curPaddingRight = parseInt(getComputedStyle(tracklistsContainer).paddingRight);
                tracklistsContainer.style.paddingRight = curPaddingRight + scrollbarWidth + 'px';
            }
        }
    }
    
    function enableTracklistsContainerScrollBar() {
        tracklistsContainer.style.overflow = '';
        tracklistsContainer.style.paddingRight = '';
    }

    function checkGlobalStates() {
        setDocScrollbarYWidth();
        checkScrollElementsVisibility();
        calcTracklistDtbsBtnPosition();
    }

    function checkStartInfoDisplaying() {
        if (!startInfoDisplay.hasAttribute('data-displayed')) {
            tracklistDatabase.dispatchEvent(new CustomEvent('endTacklistDtbsAnimation'));
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

    eventManager.clearEventHandlers(audioPlayer, 'transitionend');
    eventManager.removeOnceEventListener(document, 'scrollend', 'runHideSettings');

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
            let audioPlayerMoveInfo;

            if (
                audioPlayerContainer.dataset.windowWidth === 'below-justify-right-min' ||
                audioPlayerContainer.dataset.windowWidth === 'between-justify-right-min-max' ||
                (
                    audioPlayerMoveInfo = JSON.parse(audioPlayer.getAttribute('data-move-info')),
                    audioPlayerMoveInfo && audioPlayerMoveInfo.moving
                )
            ) {
                animateMovingAudioPlayer();
            } else {
                runShowSettings();
            }
        }
    } else {
        runShowSettings();
    }

    function animateReducingTracklistDtbsWidth() {
        let docWidth = getDocWidth();
        let audioPlayerRight = audioPlayer.getBoundingClientRect().right + window.scrollX;
        let restDocWidth = docWidth - audioPlayerRight;
        let requiredDocWidth = settingsAreaWidth;
        let curTracklistDtbsWidth = tracklistDatabase.offsetWidth;
    
        if (
            requiredDocWidth > restDocWidth &&
            curTracklistDtbsWidth > minTracklistDtbsWidth
        ) {
            tracklistDatabase.setAttribute('data-resizing', '');
    
            tracklistDatabase.style.width = curTracklistDtbsWidth + 'px';
            void tracklistDatabase.offsetWidth; // Causes a reflow
    
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

    function animateMovingAudioPlayer() {
        audioPlayer.setAttribute('data-move-info', '{"moving": true, "trigger": "settingsArea"}');
        audioPlayer.classList.add('smooth-moving');

        if (audioPlayerContainer.dataset.windowWidth !== 'above-justify-right-max') {
            let winWidth = getWinWidth();
            let minWinWidth = audioPlayer.offsetWidth + settingsAreaWidth;
            let transitionEndPoint = winWidth - minWinWidth;
            audioPlayer.style.marginLeft = transitionEndPoint + 'px';
        } else {
            audioPlayer.style.marginLeft = '';
        }

        eventManager.addOnceEventListener(audioPlayer, 'transitionend', function() {
            audioPlayer.removeAttribute('data-move-info');
            audioPlayer.classList.remove('smooth-moving');
            audioPlayer.style.marginLeft = '';

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
        checkAudioPlayerContainerJustify();
        checkScrollElementsVisibility();
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
            if (curPlaylist !== activeElem) curPlaylist.blur();

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

    eventManager.clearEventHandlers(audioPlayer, 'transitionend');

    if (highlightActiveElem) {
        if (highlightActiveElem.closest('#settings-area')) {
            cancelReturningFocus();
        } else {
            scrollEndStates.curPlaylist = true;
        }
    }

    let isDocScrolling = scrollDoc('left', 'smooth');

    if (isDocScrolling) { // Hide settings after scroll ended
        requestAnimationFrame(() => eventManager.addOnceEventListener(document, 'scrollend', runHideSettings));
    } else if (!settingsArea.hidden) { // Hide settings after opasity === 0
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
                let audioPlayerMoveInfo;

                if (
                    (
                        audioPlayerContainer.dataset.windowWidth === 'between-justify-right-min-max' ||
                        (
                            audioPlayerMoveInfo = JSON.parse(audioPlayer.getAttribute('data-move-info')),
                            audioPlayerMoveInfo && audioPlayerMoveInfo.moving
                        )
                    ) &&
                    !settingsArea.hasAttribute('data-running-action')
                ) {
                    animateMovingAudioPlayer();
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
            let requiredDocWidth = minTracklistDtbsWidth + audioPlayer.offsetWidth +
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
    
        function animateMovingAudioPlayer() {
            audioPlayer.setAttribute('data-move-info', '{"moving": true, "trigger": "settingsArea"}');

            if (!settingsArea.hidden) {
                let audioPlayerLeft = audioPlayer.getBoundingClientRect().left + window.scrollX;

                endHideSettings();
    
                audioPlayer.classList.remove('smooth-moving');
                audioPlayer.style.marginLeft = audioPlayerLeft + 'px';
                void audioPlayer.offsetWidth; // Causes a reflow
                audioPlayer.classList.add('smooth-moving');
            } else {
                checkGlobalStates();
            }
            
            audioPlayer.style.marginLeft = '';

            eventManager.addOnceEventListener(audioPlayer, 'transitionend', function() {
                audioPlayer.removeAttribute('data-move-info');
                audioPlayer.classList.remove('smooth-moving');

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
        checkAudioPlayerContainerJustify(); // Causes a reflow
        checkScrollElementsVisibility();
        calcTracklistDtbsBtnPosition();
    }
}

function checkAudioPlayerContainerJustify() {
    let winWidth = getWinWidth();
    let isDocScrollbar = isDocScrollbarCheck();
    let curScrollbarYWidth = isDocScrollbar ? scrollbarWidth : 0;
    let maxWinWidthForSettings = settingsAreaWidth * 2 + audioPlayer.offsetWidth + curScrollbarYWidth;
    let minWinWidthForSettings = audioPlayer.offsetWidth + settingsAreaWidth;

    if (winWidth < minWinWidthForSettings) {
        audioPlayerContainer.setAttribute('data-window-width', 'below-justify-right-min');
    } else if (winWidth >= minWinWidthForSettings && winWidth <= maxWinWidthForSettings) {
        audioPlayerContainer.setAttribute('data-window-width', 'between-justify-right-min-max');
    } else if (winWidth > maxWinWidthForSettings) {
        audioPlayerContainer.setAttribute('data-window-width', 'above-justify-right-max');
    }

    if (
        audioPlayerContainer.dataset.windowWidth === 'between-justify-right-min-max' &&
        !settingsArea.hidden &&
        !tracklistDatabase.classList.contains('enabled')
    ) {
        audioPlayerContainer.classList.add('justify-right');
    } else {
        audioPlayerContainer.classList.remove('justify-right');

        // Works when the window width has changed or
        // the settings are shown with window width === 'below-justify-right-min'
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
    if (keysInfoWin.classList.contains('active')) return;

    //console.log('+ highlight');

    // Searching string
    let artist = audio.dataset.artist.replace(/[\\+*?^$()[\]{}=!<>|:-]/g, '\\$&');
    let title = audio.dataset.title.replace(/[\\+*?^$()[\]{}=!<>|:-]/g, '\\$&');
    let dub = audio.dataset.dub ? ` \\(${audio.dataset.dub}\\)` : '';
    let regexp = new RegExp(`^\\d+\\.\\s${artist}\\s\u2013\\s${title}${dub}$`);
    let keyStr = Array.from(fixedCurPlaylistStrings.keys()).find(str => str.match(regexp));
    let fixedStr = fixedCurPlaylistStrings.get(keyStr);

    // Highlighting
    let startPos = curPlaylist.value.indexOf(fixedStr);
    let strLength = fixedStr.length;
    let lineBreak = (fixedStr.at(-1) === '\n') ? 1 : 0;
    let endPos = startPos + strLength - lineBreak;
    
    if (!highlightActiveElem) highlightActiveElem = document.activeElement;

    curPlaylist.select();
    curPlaylist.setSelectionRange(startPos, endPos, 'forward');
    if (curPlaylist !== highlightActiveElem) curPlaylist.blur();

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

        if (deltaScroll && deltaScroll !== lastScrollTop) {
            isScrollActive = (deltaScroll > 0 && scrollHeight - deltaScroll > clientHeight) ||
                (deltaScroll > 0 && lastScrollTop < scrollHeight - clientHeight) ||
                (deltaScroll < 0 && lastScrollTop > 0)
            ;
        }

        if (isScrollActive) {
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
    changeAudioControlsConfiguration(null);
    changeAudioPlayerColor(null);
    changePlaylistStyle(null);
    changeInitialVolume(null);
    changeNumberOfVisibleTracks(null);
    changeScrollElemsOpacity(null);
    changeWheelScrollStep(null);
    changeAddOptionsDisplaying(null);
    sortAndCreateTracklists(null);
}

//////////////////////
// Keys information //
//////////////////////

function keysInfoAction() {
    if (!keysInfoWin.classList.contains('active')) {
        showKeysInfo();
    } else {
        hideKeysInfo();
    }
}

function showKeysInfo() {
    activateModalWindow(keysInfoWin);
}

function hideKeysInfo() {
    keysInfoWin.classList.remove('active');

    promiseChange(keysInfoWin, 'transition', 'opacity', keysInfoBtn, 'KeyI', () => deactivateModalWindow(keysInfoWin));
}

// Closing key info by clicking
keysInfoWin.onclick = (event) => {
    if (event.target === keysInfoBtn) return;
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
document.addEventListener('scrollend', () => {
    delete window.targetScrollPosX;
    delete window.targetScrollPosY;
});

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
    
    window.targetScrollPosX = x;
    
    window.scrollTo({
        left: x,
        top: (window.targetScrollPosY !== undefined) ? window.targetScrollPosY : window.scrollY,
        behavior
    });
    
    return true;
}

// Remove elem activity if elem is NOT in focus
document.addEventListener('pointerdown', (event) => {
    if (event.target.matches('input:not([type="checkbox"])')) return;
    if (event.target.tagName === 'TEXTAREA') return;
    if (event.target.closest('#visible-playlist-area')) return;

    let initActiveElem = document.activeElement;

    document.addEventListener('pointerup', () => {
        let curActiveElem = document.activeElement;
        if (curActiveElem !== initActiveElem) curActiveElem.blur();
    }, {once: true});
});

// Highlighting selected track in current playlist
document.addEventListener('click', (event) => {
    if (document.activeElement === curPlaylist) {
        if (highlightActiveElem) {
            cancelReturningFocus();
            stopScrolling(KEY_SCROLLING_TIME);
        }
    }

    if (document.activeElement === document.body) {
        if (highlightActiveElem) cancelReturningFocus();

        // Continuing scrolling the playlist if there is no doc scrollbar and active elem === body
        setTimeout(() => {
            let isDocScrollbar = isDocScrollbarCheck();
            if (!accelerateScrolling || isDocScrollbar) return;

            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            startScrolling(key);
        });
    }

    if (event.target.closest('#settings-area')) return;
    if (event.target.closest('#keys-info-window')) return;
    if (event.target.closest('#visible-playlist-area')) return;
    if (event.target.closest('i')) return;
    if (event.target.closest(`
        #tracklist-database .tracklist-title,
        #tracklist-database input[type="checkbox"],
        #tracklist-database label,
        #tracklist-database button
    `)) return;
    
    highlightSelected(selectedAudio);
});

// Number inputs
let inputTicking = false;

for (let input of settingsArea.querySelectorAll('input[type="number"]')) {
    input.onkeydown = (event) => {
        if ( //Filtering keys
            (event.key >= '0' && event.key <= '9') ||
            (!event.shiftKey && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) ||
            event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
            event.code === 'Delete' || event.code === 'Backspace' ||
            event.code === 'Tab' || event.key === 'Enter' ||
            (event.ctrlKey && (event.code === 'KeyX' || event.code === 'KeyC' || event.code === 'KeyV'))
        ) {
            // Optimization for keyrepeat (ArrowUp, ArrowDown)
            if ((event.code === 'ArrowUp' || event.code === 'ArrowDown') && event.repeat) {
                if (!inputTicking) {
                    inputTicking = true;
                    setTimeout(() => inputTicking = false, 50);
                } else {
                    event.preventDefault();
                }
            }
            return true;
        } else {
            return false;
        }
    };
}

// Stop scrolling on context menu
document.oncontextmenu = () => {
    if (accelerateScrolling) stopScrollingAndClean();
};

// Document blur
document.body.onblur = () => {
    setTimeout(() => {
        stopScrollingAndClean();
        stopAccelerationAndClear();
        removeButtonHighlightings();
    });
};

// Focus handler
document.addEventListener('focus', function(event) {
    const selector = 'input, button, textarea, [tabindex]';
    if (!event.target.matches(selector)) return;

    document.getSelection().empty();
    handleFocus(event.target);
}, true);

function handleFocus(elem) {
    if (accelerateScrolling) {
        if (!scrollablePlaylist) return;

        let isDocScrollbar = isDocScrollbarCheck();
        let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
        let direction = scrollingKeysData[key].direction;
        let isReachingLimits = checkReachingPlaylistBoundaries(direction);

        // Quickly hide playlist scroll elements
        if (
            isReachingLimits &&
            elem !== visPlaylistArea &&
            isDocScrollbar &&
            !cursorOverPlaylist &&
            !pointerModeScrolling
        ) {
            hideScrollElems();
        }

        // Start/stop scrolling
        if (
            !highlightActiveElem && (
                (elem.matches('input[type="number"]') && (key === 'ArrowUp' || key === 'ArrowDown')) ||
                (!elem.matches('.tracklist-section') && elem.scrollHeight > elem.clientHeight) ||
                (elem !== visPlaylistArea && isDocScrollbar && !cursorOverPlaylist && !pointerModeScrolling)
            )
        ) {
            stopScrolling(KEY_SCROLLING_TIME);
        } else if (
                elem === visPlaylistArea ||
                elem !== curPlaylist && (
                    !isDocScrollbar ||
                    cursorOverPlaylist ||
                    pointerModeScrolling
                )
        ) {
            startScrolling(key);
        }
    }

    // Cancelling returning focus on highlightActiveElem
    if (userInitiatedFocus && highlightActiveElem && elem !== curPlaylist) cancelReturningFocus();

    // Check reaching playlist limits when focusing on the last track via Tab
    if (elem.matches('.track-info-box') && scrollablePlaylist) {
        checkReachingPlaylistBoundaries('all');
    }

    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
}

// Alignment after auto scrolling focused track title
visPlaylistArea.addEventListener('keydown', function(event) {
    if (event.code !== 'Tab') return;
    if (!scrollablePlaylist) return;
    if (activeScrollAndAlign) return;

    let track;
    if (event.target === this) track = playlist.firstElementChild;
    if (event.target.matches('.track-info-box')) {
        let prevTrack = event.target.closest('.track');
        track = event.shiftKey ? prevTrack.previousElementSibling : prevTrack.nextElementSibling;
    }
    if (!track) return;

    // Scrolling the document to center the selected track in the window
    let isPlaylistInView = isPlaylistInViewCheck();

    if (!isPlaylistInView) {
        let trackRect = track.getBoundingClientRect();
        let winHeight = getWinHeight();
        let y;

        if (trackRect.top < playlistScrollArrowBoxHeight) {
            y = (Math.round(trackRect.bottom) > playlistScrollArrowBoxHeight) ?
                trackRect.top - playlistScrollArrowBoxHeight :
                trackRect.top - winHeight / 2 + trackRect.height / 2
            ;
        }
        if (trackRect.bottom > winHeight - playlistScrollArrowBoxHeight) {
            y = (Math.round(trackRect.top) < winHeight - playlistScrollArrowBoxHeight) ? 
                playlistScrollArrowBoxHeight - (winHeight - trackRect.bottom) :
                trackRect.bottom - winHeight / 2 - trackRect.height / 2
            ;
        }
        
        if (y) {
            window.scrollBy({
                left: 0,
                top: Math.ceil(y),
                behavior: 'instant'
            });
        }
    }

    // Showing scroll elements and aligning the playlist after auto-scrolling
    if (
        track.offsetTop < playlistLim.scrollTop ||
        track.offsetTop + track.offsetHeight > playlistLim.scrollTop + playlistLim.offsetHeight
    ) {
        setTimeout(() => {
            showScrollElems();
            scrollAndAlignPlaylist({
                direction: (event.shiftKey || track === playlist.firstElementChild) ? 'up' : 'down',
                duration: KEY_SCROLLING_TIME,
                hide: true
            });
        });
    }
});

// Check element visibility in scrollable container
function isElementVisibleInScrollableContainer(container, element) {
    let containerTop = container.scrollTop;
    let containerBottom = containerTop + container.clientHeight;
    
    let elementTop = element.offsetTop;
    let elementBottom = elementTop + element.offsetHeight;
    
    let isElementTopVisible = elementTop > containerTop && elementTop < containerBottom;
    let isElementBottomVisible = elementBottom > containerTop && elementBottom < containerBottom;
    
    return isElementTopVisible || isElementBottomVisible;
}

// Creating tooltips
function initTooltipHoverIntentConnections() {
    const tooltipElems = audioPlayerContainer.querySelectorAll('[data-tooltip]');
    tooltipElems.forEach(elem => connectTooltipHoverIntent(elem));
}

function connectTooltipHoverIntent(tooltipElem) {
    setAdditionalAttributes(tooltipElem);
    
    let hoverIntent = new HoverIntent({
        elem: tooltipElem,

        repeatTask: (tooltipElem === timeRange || tooltipElem === volumeRange) ? true : false,

        executeTask() {
            tooltip.textContent = this.elem.dataset.tooltip;
            positionTooltip(this.elemRect, this.y1, 0);
        },

        dismissTask() {
            tooltip.style.opacity = '';
            tooltip.style.transform = '';
        }
    });

    tooltipHoverIntentByElem.set(tooltipElem, hoverIntent);
        
    let strategy = executeTaskHoverIntentStrategies[tooltipElem.id];
    if (strategy) hoverIntent.setExecuteTaskStrategy(strategy);
}

function positionTooltip(targElemRect, elemCursorY, shiftY) {
    let x = targElemRect.left + targElemRect.width / 2 - tooltip.offsetWidth / 2;
    x = Math.max(x, 0);
    x = Math.min(x, document.documentElement.clientWidth - tooltip.offsetWidth);

    let y = targElemRect.top - tooltip.offsetHeight - shiftY;
    if (y < 0) y = targElemRect.top + elemCursorY + 24;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    
    tooltip.style.opacity = 1;
    tooltip.style.transform = 'translateY(0)';
}

function setAdditionalAttributes(tooltipElem) {
    tooltipElem.setAttribute('aria-label', tooltipElem.getAttribute('data-tooltip'));
    if (tooltipElem.tagName !== 'BUTTON') tooltipElem.setAttribute('role', 'button');
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
            if (event.type === 'keyup' && event.code !== key) return;

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

    if (actionFunc === downKeyStepAccAction) {
        let keyAccType = accelerationData.keys[key].accelerationType;

        if (keyAccType !== accelerationType) {
            btn.classList.add('key-pressed');
        }

        actionFunc(...args);
    } else {
        btn.classList.add('key-pressed');
    }

    document.addEventListener('keyup', function removeKeyPressedFx(event) {
        if (event.code !== key) return;
        document.removeEventListener('keyup', removeKeyPressedFx);
        if (!highlightedBtns.has(key)) return;

        highlightedBtns.delete(key);

        // Checking for duplicates of highlighted buttons
        let removeHighlighting = checkHighlightedBtn();
        if (removeHighlighting) btn.classList.remove('key-pressed');

        //console.log(highlightedBtns);

        // Run action function
        if (actionFunc === downKeyStepAccAction) {
            upKeyStepAccAction(key);
        } else {
            actionFunc(...args);
        }

        function checkHighlightedBtn() {
            for (let highlightedBtn of highlightedBtns.values()) {
                if (highlightedBtn === btn) return false;
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
            checkScrollElementsVisibility();

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
            scrollbarWidth = getScrollbarWidth();
            calcTracklistsContainerMaxHeight();
            setDocScrollbarYWidth();
            checkAudioPlayerContainerJustify();
            checkScrollElementsVisibility();
            checkTracklistDatabasePositionX();
            calcTracklistDtbsBtnPosition();

            resizeTick = false;
        });
    }
    
    resizeTick = true;
});
  
function checkScrollElementsVisibility() {
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
    // the audio player is not in view and a touch device is detected
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
    if (!scrollbarWidth) return;

    let isDocScrollbar = isDocScrollbarCheck();
    let curDocScrollbarYWidth = (isDocScrollbar ? scrollbarWidth : 0) + 'px';
    let savedDocScrollbarYWidth = cssRoot.style.getPropertyValue('--document-scrollbar-y-width');

    if (curDocScrollbarYWidth !== savedDocScrollbarYWidth) {
        cssRoot.style.setProperty('--document-scrollbar-y-width', curDocScrollbarYWidth);
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
    window.targetScrollPosY = y;

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
    window.targetScrollPosY = y;

    window.scrollTo({
        left: (window.targetScrollPosX !== undefined) ? window.targetScrollPosX : window.scrollX,
        top: y,
        behavior: 'smooth'
    });
});

// Modal window on/off
function activateModalWindow(modalWindow) {
    let activeElem = document.activeElement;
    if (!savedActiveElem && activeElem !== document.body) savedActiveElem = activeElem;

    tracklistDatabase.setAttribute('inert', '');
    audioPlayer.setAttribute('inert', '');
    settingsArea.parentElement.setAttribute('inert', '');
    if (modalWindow !== keysInfoWin) keysInfoWin.setAttribute('inert', '');

    modalWindow.hidden = false;
    void modalWindow.offsetWidth;  // Causes a reflow
    modalWindow.classList.add('active');

    const staticArea = modalWindow.querySelector('.static-area');
    if (staticArea) {
        let staticAreaHeight = getComputedStyle(staticArea).height;
        modalWindow.style.setProperty('--static-area-height', staticAreaHeight);
    }
}

function deactivateModalWindow(modalWindow) {
    modalWindow.hidden = true;

    keysInfoWin.removeAttribute('inert');

    if (keysInfoWin.hidden && tracklistDelWin.hidden && tracklistMgrWin.hidden) {
        tracklistDatabase.removeAttribute('inert');
        audioPlayer.removeAttribute('inert');
        settingsArea.parentElement.removeAttribute('inert');

        if (savedActiveElem && savedActiveElem.tabIndex !== -1) savedActiveElem.focus();
        savedActiveElem = null;

        highlightSelected(selectedAudio);
    }
}

// Set delay for group animations
function setAnimationDelay(action, idx, func) {
    let key = action + '_' + crypto.randomUUID();
    let delay = idx * 20;
    
    animationDelays[key] = setTimeout(function() {
        delete animationDelays[key];
        func();
    }, delay);
}

function cancelAllAnimationDelays(action) {
    Object.keys(animationDelays).forEach(key => {
        if (key.startsWith(action)) {
            clearTimeout(animationDelays[key]);
            delete animationDelays[key];
        }
    });
}

// Formatting text
function correctText(str) {
    return str.trim()
        .replace(/\s+/g, ' ')
        .replace(/[\u2013\u2014\u2212]/g, '-')
    ;
}

function restoreText(str) {
    return str.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\s-\s/g, ' \u2013 ')
        .replace(/\|/g, '<wbr>|<wbr>')
        .replace(/\//g, '<wbr>/<wbr>')
        .replace(/\\/g, '<wbr>\\<wbr>')
        .replace(/(<wbr>)+/g, '<wbr>')
    ;
}

function sanitizePathSegment(str) {
    let sanitized = str.trim()
        .replace(/[/\\?%*:|"<>;]/g, '-')
        .replace(/\s+/g, '_')
    ; 
    return encodeURIComponent(sanitized);
}

function clearTextFromHtml(str) {
    return str.replace(/<.*?>/gi, '');
}

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

customElements.define('audio-controls', class extends HTMLElement {
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

            let rotateTime = (changeAudioControlsConfiguration.eventType === 'keydown') ? LAG : 0;
            setTimeout(() => {
                configBtn.parentElement.classList.add('rotate');

                promiseChange(configBtn.parentElement, 'animation', null, configBtn, 'KeyZ', () => {
                    configBtn.parentElement.classList.remove('rotate');
                });
            }, rotateTime);
        }

        switch (newValue) {
            case 'classic':
                audioPlayer.insertAdjacentHTML('beforeend', configClassic);
                break;
            case 'stylish':
                audioPlayer.insertAdjacentHTML('beforeend', configStylish);
                break;
        }
        
        const tmplConfig = document.getElementById('tmpl-' + newValue);
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(tmplConfig.content.cloneNode(true));
        tmplConfig.remove();
    }
});

function changeAudioControlsConfiguration(idx) {
    config = configsBank[idx] || configsBank[0];
    audioControls.setAttribute('config', config);

    if (visibleTracksCheckbox.checked) {
        calcTracklistsContainerMaxHeight();
        setDocScrollbarYWidth();
        checkScrollElementsVisibility();
        calcTracklistDtbsBtnPosition();
    } else if (changeAudioControlsConfiguration.eventType) {
        changeNumberOfVisibleTracks(numOfVisTracks);
    }

    delete changeAudioControlsConfiguration.eventType;

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
    let value = this.checked ? visibleTracksInput.value : null;
    changeNumberOfVisibleTracks(value);
};

visibleTracksInput.oninput = () => {
    changeNumberOfVisibleTracks(visibleTracksInput.value);
};

function changeNumberOfVisibleTracks(value) {
    const label = visibleTracksCheckbox.parentElement.querySelector('label');
    
    if (value === null || !visibleTracksCheckbox.checked) {
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
        value = Math.max(minValue, Math.min(maxValue, Math.round(+value)));
    }

    numOfVisTracks = value;
    if (visibleTracksInput.value !== value.toString()) visibleTracksInput.value = value;
    playlistLim.style.setProperty('--visible-tracks', value);
    localStorage.setItem('number_of_visible_tracks', value);
    localStorage.setItem('visible_tracks_checkbox_checked', visibleTracksCheckbox.checked);

    scrollDoc('right', 'instant');
    calcTracklistsContainerMaxHeight();
    setDocScrollbarYWidth();
    checkAudioPlayerContainerJustify();
    checkPlaylistScrollability();
    checkScrollElementsVisibility();
    calcTracklistDtbsBtnPosition();

    if (accelerateScrolling) {
        let isDocScrollbar = isDocScrollbarCheck();

        if (isDocScrollbar) {
            stopScrolling(KEY_SCROLLING_TIME);
        } else {
            let key = Array.from(activeScrollKeys)[activeScrollKeys.size - 1];
            if (key === 'ArrowUp' || key === 'ArrowDown') return;
            
            startScrolling(key);
        }
    }

    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
}

///////////////////////////
// Audio player coloring //
///////////////////////////

const audioPlayerColorsBank = ['black', 'white'];
let audioPlayerColor = localStorage.getItem('audio_player_color');

function changeAudioPlayerColor(idx) {
    highlightSelected(selectedAudio);

    audioPlayerContainer.classList.remove('color-' + audioPlayerColor);
    audioPlayerColor = audioPlayerColorsBank[idx] || audioPlayerColorsBank[0];
    localStorage.setItem('audio_player_color', audioPlayerColor);
    audioPlayerContainer.classList.add('color-' + audioPlayerColor);

    console.log('audio player color = ' + audioPlayerColor);

    audioPlayer.classList.add('changing-color');
    promiseChange(null, null, null, colorBtn, 'KeyX', () => audioPlayer.classList.remove('changing-color'));
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

let settedVolume = localStorage.getItem('audio_player_volume');
let savedVolume;

function changeInitialVolume(value) {
    if (value === null) value = DEFAULTS_DATA['audio-player-volume'];
    savedVolume = +value === 0 ? DEFAULTS_DATA['audio-player-volume'] : +value;

    let xPos = +value * (volumeRange.offsetWidth - volumeBar.offsetWidth);
    let volumePos = moveVolumeAt(xPos);
    setVolume(volumePos);

    showVolumeIcon(settedVolume);
    volumeBar.classList.toggle('active', settedVolume);
    
    tooltipHoverIntentByElem.get(volumeRange).executeTask();
}

/////////////////////////////
// Scroll elements opacity //
/////////////////////////////

const scrollElemsOpacityInput = document.getElementById('scroll-elements-opacity-input');
let scrollElemsOpacity = localStorage.getItem('scroll_elements_opacity');

scrollElemsOpacityInput.oninput = () => {
    changeScrollElemsOpacity(scrollElemsOpacityInput.value);
};

function changeScrollElemsOpacity(value) {
    if (value === null) {
        value = DEFAULTS_DATA['scroll-elements-opacity'];
    } else {
        let minValue = +scrollElemsOpacityInput.min;
        let maxValue = +scrollElemsOpacityInput.max;
        value = Math.max(minValue, Math.min(maxValue, Math.round(+value)));
    }

    scrollElemsOpacity = value;
    if (scrollElemsOpacityInput.value !== value.toString()) scrollElemsOpacityInput.value = value;
    localStorage.setItem('scroll_elements_opacity', value);

    audioPlayerContainer.style.setProperty('--scroll-elements-opacity', value / 100);
}

///////////////////////
// Wheel scroll step //
///////////////////////

const wheelScrollStepInput = document.getElementById('wheel-scroll-step-input');
let wheelScrollStep = localStorage.getItem('wheel_scroll_step');

wheelScrollStepInput.oninput = () => {
    changeWheelScrollStep(wheelScrollStepInput.value);
};

function changeWheelScrollStep(value) {
    if (value === null) {
        value = DEFAULTS_DATA['wheel-scroll-step'];
    } else {
        let minValue = +wheelScrollStepInput.min;
        let maxValue = +wheelScrollStepInput.max;
        value = Math.max(minValue, Math.min(maxValue, Math.round(+value)));
    }

    wheelScrollStep = value;
    if (wheelScrollStepInput.value !== value.toString()) wheelScrollStepInput.value = value;
    localStorage.setItem('wheel_scroll_step', value);
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
    if (isChecked === null) isChecked = addOptionsCheckbox.checked = false;
    localStorage.setItem('add_options_checkbox_checked', isChecked);

    if (isChecked) {
        audioPlayerContainer.classList.add('add-options-active');
    } else {
        audioPlayerContainer.classList.remove('add-options-active');

        tracklistDatabase.querySelectorAll('input[type="checkbox"]').forEach(chBox => {
            chBox.checked = true;
            if (chBox.matches('[id$="all"]')) chBox.classList.remove('partial-list');
        });
    }

    calcTracklistsTextIndent();
}

function calcTracklistsTextIndent(list = null) {
    if (!tracklistDatabase.classList.contains('enabled')) return;

    if (list) {
        runCalcTextIndent(list);
    } else {
        let addOptionsActivity = audioPlayerContainer.classList.contains('add-options-active') ? 'active' : 'inactive';
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

// Highlight the button element when pressing the label element
tracklistDatabase.addEventListener('pointerdown', (event) => {
    let manageTrklLabel = event.target.closest('label[for^="edit-tracklist"] + label');
    if (!manageTrklLabel) return;

    manageTrklLabel.previousElementSibling.classList.add('key-pressed');

    document.addEventListener('pointerup', () => {
        manageTrklLabel.previousElementSibling.classList.remove('key-pressed');
    }, {once: true});
});

tracklistDatabase.onchange = handleTracklistCheckboxChange;

tracklistDatabase.onclick = (event) => {
    let target;

    // Sort tracklists
    if (event.target.closest('#sort-tracklists')) {
        let trlsSortOrderIdx = trlsSortOrderBank.indexOf(trlsSortOrder);
        sortAndCreateTracklists(trlsSortOrderIdx + 1);
        return;
    }
    // Create new tracklist
    if (event.target === createTracklistBtn) {
        showTracklistManager(null);
        return;
    }
    // Expand all tracklist details
    if (event.target === expandAllTrlDetailsBtn) {
        expandAllTracklistDetails();
        return;
    }
    // Collapse all tracklist details
    if (event.target === collapseAllTrlDetailsBtn) {
        collapseAllTracklistDetails();
        return;
    }
    // Clear playlist button
    if (event.target === clearPlaylistBtn) {
        clearPlaylist();
        return;
    }
    // Delete tracklist button
    if (target = event.target.closest('i[class*="delete-tracklist-tracks"]')) {
        const tracklistSection = target.closest('.tracklist-section');
        showTracklistDeletion(tracklistSection);
        return;
    }
    // Tracklist title
    if (target = event.target.closest('.tracklist-title')) {
        const tracklistSection = target.closest('.tracklist-section');
        toggleTracklistDetails(tracklistSection);
        return;
    }
    // Replace/add to playlist buttons
    if (target = event.target.closest('i[class*="tracklist-to-playlist"]')) {
        const tracklistSection = target.closest('.tracklist-section');
        let clearPlaylist = target.hasAttribute('data-clear') ? true : false;
        addTracklistToPlaylist(tracklistSection, clearPlaylist);
        return;
    }
    // Manage current tracklist
    if (target = event.target.closest('[id^="edit-tracklist"]')) {
        const tracklistSection = target.closest('.tracklist-section');
        showTracklistManager(tracklistSection);
        return;
    }
};

function handleTracklistCheckboxChange(event) {
    if (event.target.tagName !== 'INPUT' || event.target.type !== 'checkbox') return;

    const tracklistDetails = event.target.closest('.tracklist-details');
    const listCheckboxes = tracklistDetails.querySelectorAll('.list input[type="checkbox"]');

    if (event.target.closest('header.strip')) {
        const checkboxAll = event.target;

        listCheckboxes.forEach(chBox => chBox.checked = checkboxAll.checked);
        checkboxAll.classList.remove('partial-list');
    } else if (event.target.closest('.list')) {
        const checkboxAll = tracklistDetails.querySelector('header.strip input[type="checkbox"]');
        const checkedListCheckboxes = tracklistDetails.querySelectorAll('.list input[type="checkbox"]:checked');
        let isAllCheckBoxesChecked = listCheckboxes.length === checkedListCheckboxes.length;

        checkboxAll.checked = isAllCheckBoxesChecked;
        checkboxAll.classList.toggle('partial-list', checkedListCheckboxes.length && !isAllCheckBoxesChecked)
    }
}

function expandAllTracklistDetails() {
    for (let tracklistSection of tracklistsContainer.children) {
        toggleTracklistDetails(tracklistSection, { targetState: 'expand', applyToAll: true });
    }
}

function collapseAllTracklistDetails() {
    for (let tracklistSection of tracklistsContainer.children) {
        toggleTracklistDetails(tracklistSection, { targetState: 'collapse', applyToAll: true });
    }
}

function clearPlaylist() {
    console.log('clear playlist');

    createPlaylist([], true);
}

function toggleTracklistDetails(tracklistSection, options = {}) {
    const tracklistDetails = tracklistSection.querySelector('.tracklist-details');
    let { targetState = '', applyToAll = false } = options;

    if (tracklistDetails.style.height === '0px' && targetState === 'collapse') return;
    if (tracklistDetails.style.height !== '0px' && targetState === 'expand') return;

    tracklistsContainer.setAttribute('data-toggling-details', '');
    tracklistsContainer.classList.add('no-animation');

    let trlDetailsId = tracklistDetails.id;
    cancelAnimationFrame(trlDetailsAnimationFrameIds[trlDetailsId]);
    eventManager.removeOnceEventListener(tracklistDetails, 'transitionend', 'endHeightChanging');

    audioPlayerContainer.style.minHeight = '';

    if (tracklistDetails.style.height === '0px') {
        tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
    } else {
        tracklistDetails.style.height = tracklistDetails.scrollHeight + 'px';
        void tracklistDetails.offsetHeight; // Causes a reflow
        tracklistDetails.style.height = 0;
    }

    toggleTracklistActivitiesFocusability(tracklistDetails);

    let isExpanded = (tracklistDetails.style.height !== '0px') ? true : false;
    tracklistSection.setAttribute('aria-expanded', String(isExpanded));

    trlDetailsAnimationFrameIds[trlDetailsId] = requestAnimationFrame(checkScrollabilities);
    eventManager.addOnceEventListener(tracklistDetails, 'transitionend', endHeightChanging);

    function endHeightChanging() {
        cancelAnimationFrame(trlDetailsAnimationFrameIds[trlDetailsId]);
        delete trlDetailsAnimationFrameIds[trlDetailsId];

        if (isExpanded) {
            tracklistDetails.style.height = 'auto';
            if (!applyToAll) scrollToViewAnimatedElement(tracklistsContainer, tracklistSection, commonSpacing);
        }

        if (!Object.keys(trlDetailsAnimationFrameIds).length) {
            tracklistsContainer.removeAttribute('data-toggling-details');
            tracklistsContainer.classList.remove('no-animation');
            
            checkTracklistDtbsAction();
            checkTracklistDtbsSorting();
        }
    }
    
    function checkScrollabilities() {
        if (applyToAll && tracklistSection !== tracklistsContainer.lastElementChild) return;
        
        setDocScrollbarYWidth();
        setTracklistsContainerScrollability();
        if (isExpanded && !applyToAll) scrollToViewAnimatedElement(tracklistsContainer, tracklistSection, commonSpacing);
        
        trlDetailsAnimationFrameIds[trlDetailsId] = requestAnimationFrame(checkScrollabilities);
    }
}

function addTracklistToPlaylist(tracklistSection, clearPlaylist) {
    if (clearPlaylist && removingTracksNum && playlist.children.length > 100) return;

    console.log('playlist changed');
    
    const checkboxAll = tracklistSection.querySelector('header.strip input[type="checkbox"]');
    const list = tracklistSection.querySelector('.list');
    let listLength = list.children.length;
    let noTracksChecked = !listLength || (!checkboxAll.checked && !checkboxAll.classList.contains('partial-list'));
    let tracksData = noTracksChecked ? [] : getSelectedTracksData(list);

    createPlaylist(tracksData, clearPlaylist);

    if (shuffleBtn.firstElementChild.classList.contains('active')) setPlaylistOrder(false);
    if (!clearPlaylist) highlightSelected(selectedAudio);
}

function getSelectedTracksData(list) {
    return [].reduce.call(list.children, (tracksData, tracklistTrack) => {
        let isChecked = tracklistTrack.querySelector('input[type="checkbox"]').checked;
        if (isChecked) tracksData.push({...tracklistTrack.dataset});
        return tracksData;
    }, []);
}

////////////////////////
// Tracklist Deletion //
////////////////////////

function showTracklistDeletion(tracklistSection) {
    if (!tracklistMgrWin.hidden) return;

    document.getSelection().empty();

    const tracklistRemovalConfirm = tracklistDelWin.querySelector('.tracklist-removal-confirm');
    const tracklistRemovalCheckbox = tracklistRemovalConfirm.querySelector('input[type="checkbox"]');
    const okBtn = tracklistDelWin.querySelector('.ok-button');
    const cancelBtn = tracklistDelWin.querySelector('.cancel-button');
    const closeBtn = tracklistDelWin.querySelector('.close-button');

    const tracklistTitle = tracklistSection.querySelector('.tracklist-title').textContent;
    const tracklistDetails = tracklistSection.querySelector('.tracklist-details');
    const list = tracklistDetails.querySelector('.list');
    const allTracklistTracks = Array.from(list.children);
    const checkboxAll = tracklistDetails.querySelector('header.strip input[type="checkbox"]');

    let tracklistId = tracklistSection.dataset.id;
    let tracklistData = tracklistsMapData.get(tracklistId);
    let listLength = allTracklistTracks.length;
    let noTracksChecked = !checkboxAll.checked && !checkboxAll.classList.contains('partial-list');
    let shouldFocusTracklistSection = document.activeElem !== document.body;
    let deletingList = [];

    if (listLength) {
        if (noTracksChecked) {
            okBtn.disabled = true;
        } else {
            const delTracks = tracklistDelWin.querySelector('.deleting-tracks');
            let delTracksFragment = document.createDocumentFragment();
    
            allTracklistTracks.forEach(tracklistTrack => {
                const checkbox = tracklistTrack.querySelector('input[type="checkbox"]');
                if (!checkbox.checked) return;

                let trackInfo = tracklistTrack.textContent.replace(/\d+\./, '');
                let li = document.createElement('li');
                li.textContent = trackInfo;
                delTracksFragment.appendChild(li);

                deletingList.push(tracklistTrack);
            });

            delTracks.appendChild(delTracksFragment);
        }
    }

    let delListLength = deletingList.length;
    let delTracksInfo = !delListLength ? 'No' : (delListLength < listLength) ? delListLength : 'All';
    tracklistDelWin.querySelector('.deleting-tracks-number').textContent = delTracksInfo;
    tracklistDelWin.querySelector('.plural-suffix').textContent = (delListLength === 1) ? '' : 's';
    tracklistDelWin.querySelector('.target-tracklist').textContent = tracklistTitle;

    if (delTracksInfo === 'No') {
        tracklistDelWin.querySelector('#tracklist-deletion-description').classList.add('period');

        if (listLength) {
            tracklistDelWin.querySelector('.warning-info').hidden = true;
        } else {
            tracklistDelWin.querySelector('.empty-tracklist-removal-confirm').hidden = false;
        }
    } else if (delTracksInfo === 'All') {
        tracklistRemovalConfirm.hidden = false;
    }

    activateModalWindow(tracklistDelWin);

    tracklistDelWin.onclick = (event) => {
        if (tracklistDatabase.classList.contains('updating')) return;

        if (event.target.closest('.ok-button')) {
            tracklistDatabase.classList.add('updating');

            if (delListLength) {
                confirmTracksDeletion();
            } else {
                deleteEmptyTracklist();
            }
        }

        if (
            event.target.closest('.close-button') ||
            event.target.closest('.cancel-button') ||
            (!event.target.closest('.dialog-box') && !document.getSelection().toString().length)
        ) {
            hideTracklistDeletion();
        }
    };

    // Functions //

    async function confirmTracksDeletion() {
        console.log(`%cdelete tracks from "${tracklistTitle}" tracklist`, `
            color: #fafafa;
            background-color: rgba(196, 13, 43, 0.9);
        `);

        let shouldDeleteTracklist = !tracklistRemovalConfirm.hidden && tracklistRemovalCheckbox.checked;
        let pendDelTrackIds = [];
        let successDelTrackIds = new Set();

        prepareDeletion();
    
        deletingList.forEach(tracklistTrack => pendDelTrackIds.push(tracklistTrack.dataset.id));

        if (shouldDeleteTracklist) {
            let isTracklistDeleted = await deleteTracklist(tracklistId);
            if (isTracklistDeleted) {
                successDelTrackIds = new Set(pendDelTrackIds);
                updateTracklistsMapData(); // Temporary code
            }
        } else {
            successDelTrackIds = new Set( await deleteTracks(pendDelTrackIds) );
            if (successDelTrackIds.size) updateTracklistsMapData(successDelTrackIds); // Temporary code
        }

        hideTracklistDeletion();
        await new Promise(resolve => eventManager.addOnceEventListener(tracklistDelWin, 'transitionend', resolve));

        if (successDelTrackIds.size) {
            updatePlaylistTracks();
            updateTracklistTracks();
        } else {
            finalizeTracklistDatabaseUpdating();
        }

        // Functions //

        function prepareDeletion() {
            tracklistRemovalCheckbox.disabled = true;
            okBtn.disabled = true;
            cancelBtn.disabled = true;
            closeBtn.disabled = true;
        }
        
        function updatePlaylistTracks() {
            let delNum = 0;

            [].forEach.call(playlist.children, playlistTrack => {
                let trackId = playlistTrack.querySelector('audio').dataset.id;
    
                if (successDelTrackIds.has(trackId)) {
                    if (playlistTrack.classList.contains('pending-removal')) return;
                    if (playlistTrack.classList.contains('removing')) return;
    
                    delNum++;
                    playlistTrack.classList.add('pending-removal');
                    setAnimationDelay('remove-track-from-playlist', delNum, () => removeTrackFromPlaylist(playlistTrack));

                    let audio = playlistTrack.querySelector('audio');
                    if (audio === selectedAudio) finishPlaying();
                }
            });
        }

        function updateTracklistTracks() {
            tracklistDtbsBtn.classList.remove('enabled');
            tracklistDtbsBtn.classList.add('waiting');

            let isExpanded = tracklistSection?.ariaExpanded === 'true';

            if (isExpanded) {
                shrinkAllTracklistTracks();
            } else {
                if (shouldDeleteTracklist) {
                    deleteTracklistSection();
                } else {
                    expandTracklistDetails();
                }
            }

            function expandTracklistDetails() {
                toggleTracklistDetails(tracklistSection, { targetState: 'expand', applyToAll: false });
                eventManager.addOnceEventListener(tracklistDetails, 'transitionend', shrinkAllTracklistTracks);
            }

            function shrinkAllTracklistTracks() {
                let tracklistTrackNum = allTracklistTracks.length;

                allTracklistTracks.reverse().forEach((tracklistTrack, idx) => {
                    setAnimationDelay('shrink-track-in-tracklist', idx * 2, () =>
                        shrinkTracklistTrack(tracklistTrack));
                });

                function shrinkTracklistTrack(tracklistTrack) {
                    tracklistTrack.style.height = tracklistTrack.offsetHeight + 'px';
                    tracklistTrack.classList.add('shrink');
        
                    eventManager.addOnceEventListener(tracklistTrack, 'animationend', () => {
                        tracklistTrackNum--;
                        if (!tracklistTrackNum) determineTracklistDeletionAction();
                    });
                }
            }

            function determineTracklistDeletionAction() {
                if (shouldDeleteTracklist) {
                    deleteTracklistSection();
                } else {
                    let activeTracklistTrackId = getActiveTracklistTrackId();

                    list.innerHTML = '';

                    if (tracklistData.tracks.length) {
                        createRestTracklistTracks(activeTracklistTrackId);
                    } else {
                        finalizeTracklistDatabaseUpdating();
                    }
                }
            }

            function getActiveTracklistTrackId() {
                let activeElem = savedActiveElem || document.activeElement;
            
                if (list.contains(activeElem)) {
                    const li = activeElem.closest('li');
                    let trackId = li.dataset.id;

                    shouldFocusTracklistSection = successDelTrackIds.has(trackId);
                    if (!shouldFocusTracklistSection) return trackId;
                } else {
                    shouldFocusTracklistSection = !tracklistSection.contains(activeElem);
                }
            
                return null;
            }

            function createRestTracklistTracks(activeTracklistTrackId) {
                checkboxAll.checked = true;
                checkboxAll.classList.remove('partial-list');
        
                createTracklistTracks(list, tracklistData);
                toggleTracklistActivitiesFocusability(tracklistDetails);
                calcTracklistsTextIndent(list);

                const allNewTracklistTracks = Array.from(list.children);
                let tracklistTrackNum = allNewTracklistTracks.length;

                allNewTracklistTracks.forEach((tracklistTrack, idx) => {
                    if (activeTracklistTrackId && tracklistTrack.dataset.id === activeTracklistTrackId) {
                        const checkboxLabel = tracklistTrack.querySelector('label.design-proxy');
                        decideFocusAction(checkboxLabel);
                    }

                    tracklistTrack.classList.add('no-size');
                    setAnimationDelay('grow-track-in-tracklist', idx * 2, () => growTracklistTrack(tracklistTrack));
                });

                requestAnimationFrame(function callback() {
                    scrollToViewAnimatedElement(tracklistsContainer, tracklistSection, commonSpacing);
                    if (tracklistTrackNum) requestAnimationFrame(callback);
                });

                function growTracklistTrack(tracklistTrack) {
                    tracklistTrack.classList.remove('no-size');
                    tracklistTrack.style.height = tracklistTrack.offsetHeight + 'px';
                    tracklistTrack.classList.add('grow');
    
                    eventManager.addOnceEventListener(tracklistTrack, 'animationend', () => {
                        tracklistTrackNum--;

                        tracklistTrack.classList.remove('grow');
                        tracklistTrack.style.height = '';
        
                        if (!tracklistTrackNum) finalizeTracklistDatabaseUpdating();
                    });
                }
            }
        }
    }

    async function deleteEmptyTracklist() {
        let isTracklistDeleted = await deleteTracklist();

        if (isTracklistDeleted) {
            updateTracklistsMapData(); // Temporary function
            deleteTracklistSection();
        } else {
            hideTracklistDeletion();
            await new Promise(resolve => eventManager.addOnceEventListener(tracklistDelWin, 'transitionend', resolve));
            finalizeTracklistDatabaseUpdating();
        }
    }

    async function deleteTracklistSection() {
        console.log(`%cdelete "${tracklistTitle}" tracklist section`, `
            color: #fafafa;
            background-color: rgba(196, 13, 43, 0.9);
        `);

        if (tracklistDelWin.classList.contains('active')) {
            hideTracklistDeletion();
            await new Promise(resolve => eventManager.addOnceEventListener(tracklistDelWin, 'transitionend', resolve));
        }

        tracklistSection.classList.remove('show');

        eventManager.addOnceEventListener(tracklistSection, 'transitionend', () => {
            tracklistSection.style.height = tracklistSection.offsetHeight + 'px';
            tracklistSection.classList.add('shrink');

            eventManager.addOnceEventListener(tracklistSection, 'animationend', () => {
                if (
                    tracklistSection.contains(document.activeElement) ||
                    (shouldFocusTracklistSection && document.activeElement === document.body)
                ) {
                    const newActiveElem = tracklistSection.nextElementSibling ||
                        tracklistSection.previousElementSibling ||
                        createTracklistBtn
                    ;
                    decideFocusAction(newActiveElem);
                    shouldFocusTracklistSection = false;
                }

                tracklistSection.remove();

                finalizeTracklistDatabaseUpdating();
            });
        });
    }

    function deleteTracks(deletedTrackIds) {
        const taskPromises = deletedTrackIds.map(sendTrackDeletion);

        return Promise.allSettled(taskPromises)
            .then(results => {
                let successfulResults = results.filter(result => result.status === 'fulfilled');
                let successDelTrackIds = successfulResults.map(result => result.value.trackId);
                return successDelTrackIds;
            });

        function sendTrackDeletion(delTrackId) {
            /*return fetch('/api/tracks?trackId=' + encodeURIComponent(delTrackId), {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Server responded with status: ' + response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Track deletion success:', data);
                    return { trackId: delTrackId };
                })
                .catch(error => {
                    console.error('Track deletion error:', error);
                    return Promise.reject();
                })
            ;*/

            return new Promise(resolve => setTimeout(() => resolve({ trackId: delTrackId }), 1e3));
        }
    }

    function deleteTracklist() {
        /*return fetch('/api/tracklists?tracklistId=' + encodeURIComponent(tracklistId), {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) throw new Error('Server responded with status: ' + response.status);
                return response.json();
            })
            .then(data => {
                console.log('Tracklist deletion success:', data);
                tracklistsMapData = data.tracklistsMapData;
                return true;
            })
            .catch(error => {
                console.error('Tracklist deletion error:', error);
                return false;
            })
        ;*/

        return new Promise(resolve => setTimeout(() => resolve(true), 1e3)); // Temporary code
    }

    function updateTracklistsMapData(delTrackIds = null) { // Temporary code
        if (delTrackIds) {
            let restTracksData = [];

            for (let i = 0, order = 1; i < tracklistData.tracks.length; i++) {
                let trackData = tracklistData.tracks[i];

                if (!delTrackIds.has(trackData.id)) {
                    trackData.order = order++;
                    restTracksData.push(trackData);
                }
            }

            tracklistData.tracks = restTracksData;
            tracklistData.dateUpdated = new Date().toISOString();

            console.log(tracklistData);
        } else {
            tracklistsMapData.delete(tracklistId);
            
            console.log(tracklistsMapData);
        }
    }

    function finalizeTracklistDatabaseUpdating() {
        tracklistDatabase.classList.remove('updating');
        tracklistDtbsBtn.classList.remove('waiting');
        tracklistDtbsBtn.classList.add('enabled');

        if (shouldFocusTracklistSection) decideFocusAction(tracklistSection);
        calcTracklistsContainerMaxHeight();
        setDocScrollbarYWidth();
        checkTracklistDtbsAction();
    }
}

function hideTracklistDeletion() {
    const tracklistRemovalConfirm = tracklistDelWin.querySelector('.tracklist-removal-confirm');
    const tracklistRemovalCheckbox = tracklistRemovalConfirm.querySelector('input[type="checkbox"]');

    tracklistDelWin.onclick = null;

    tracklistDelWin.classList.remove('active');

    eventManager.addOnceEventListener(tracklistDelWin, 'transitionend', () => {
        deactivateModalWindow(tracklistDelWin);

        tracklistDelWin.querySelector('#tracklist-deletion-description').classList.remove('period');
        tracklistDelWin.querySelector('.deleting-tracks-number').textContent = '';
        tracklistDelWin.querySelector('.target-tracklist').textContent = '';
        tracklistDelWin.querySelector('.deleting-tracks').innerHTML = '';
        tracklistRemovalConfirm.hidden = true;
        tracklistRemovalCheckbox.checked = true;
        tracklistRemovalCheckbox.disabled = false;
        tracklistDelWin.querySelector('.empty-tracklist-removal-confirm').hidden = true;
        tracklistDelWin.querySelector('.warning-info').hidden = false;
        tracklistDelWin.querySelector('.ok-button').disabled = false;
        tracklistDelWin.querySelector('.cancel-button').disabled = false;
        tracklistDelWin.querySelector('.close-button').disabled = false;
    });
}

///////////////////////
// Tracklist Manager //
///////////////////////

function tracklistManagerAction(tracklistSection) {
    if (tracklistMgrWin.hidden) {
        showTracklistManager(tracklistSection);
    } else if (tracklistMgrWin.classList.contains('active')) {
        checkChangesBeforeHideTracklistManager();
    }
}

function showTracklistManager(tracklistSection) {
    if (!tracklistDelWin.hidden) return;

    document.getSelection().empty();
    
    const tracklistMgrScrollArea = tracklistMgrWin.querySelector('.scrollable-area');
    const tracklistMgrTitle = tracklistMgrWin.querySelector('#tracklist-manager-title');
    const tracklistMgrDescr = tracklistMgrWin.querySelector('#tracklist-manager-description');
    const tracklistForm = tracklistMgrWin.querySelector('.tracklist-form');
    const trackForms = tracklistMgrWin.querySelector('.track-forms');
    const dropZone = tracklistMgrWin.querySelector('.drop-zone');
    const addTrackFormItemBtn = dropZone.firstElementChild;
    const tracklistRemovalConfirm = tracklistMgrWin.querySelector('.tracklist-removal-confirm');
    const tracklistRemovalCheckbox = tracklistRemovalConfirm.querySelector('input[type="checkbox"]');
    const totalUploadRow = tracklistMgrWin.querySelector('.total-upload-row');
    const totalUploadProgress = totalUploadRow.querySelector('.upload-progress');
    const totalDisplayProgress = totalUploadRow.querySelector('.display-progress');
    const okBtn = tracklistMgrWin.querySelector('.ok-button');
    const cancelBtn = tracklistMgrWin.querySelector('.cancel-button');
    const closeBtn = tracklistMgrWin.querySelector('.close-button');

    tracklistForm.innerHTML = `
        <p class="tracklist-title-edit form-row text">
            <label for="input-tracklist-title" class="label-text">Tracklist title:</label
            ><input id="input-tracklist-title" name="tracklist-title" type="text" placeholder="Enter tracklist title"
            ><button class="reset inactive" tabindex="-1"><i class="icon-ccw"></i></button
            ><span class="state">
                <i class="icon-check ok" hidden></i>
                <i class="icon-cancel fail" hidden></i>
            </span>
        </p>
        <p class="tracklist-cover-edit form-row file">
            <span class="label-text">Tracklist cover:<br>
                <span class="add-info">(optional, 120x120px)</span>
            </span
            ><label for="input-tracklist-cover" class="file-name" tabindex="0"></label
            ><input id="input-tracklist-cover" name="cover-file" type="file" accept="image/*" data-optional
            ><button class="reset inactive" tabindex="-1"><i class="icon-ccw"></i></button
            ><span class="state">
                <i class="icon-check ok" hidden></i>
                <i class="icon-cancel fail" hidden></i>
            </span>
        </p>
    `;

    const tracklistTitleInput = tracklistForm.querySelector('.tracklist-title-edit > input[type="text"]');
    const tracklistCoverInput = tracklistForm.querySelector('.tracklist-cover-edit > input[type="file"]');
    const coverFileName = tracklistCoverInput.parentElement.querySelector('.file-name');

    let dataUpdateStatus = 'data collection';
    let action = tracklistSection ? 'edit' : 'create';
    let allInputs = [tracklistTitleInput, tracklistCoverInput];
    let delTrackFieldsetById = new Map();
    let postDialogSelectionTimers = new Map();
    let uploadProgressByUploadFormRow = new Map();
    let trackFormItemsNum = 0;
    let animationsNum = 0;
    let tracklistDetails, list, tracklistId, tracklistData, trackStates;

    if (action === 'edit') {
        tracklistDetails = tracklistSection.querySelector('.tracklist-details');
        list = tracklistDetails.querySelector('.list');
        tracklistId = tracklistSection.dataset.id;
        tracklistData = tracklistsMapData.get(tracklistId);
        let coverSrc = tracklistData.cover;
        let baseUrl = window.location.protocol + '//' + window.location.host + '/';
        let coverUrl = null;
        let tracklistTitle = tracklistSection.querySelector('.tracklist-title').textContent;

        tracklistMgrTitle.textContent = 'Manage Current Tracklist';
        tracklistMgrDescr.innerHTML = `
            Edit tracklist <span class="target-tracklist quotes">${tracklistTitle}</span> with new tracks and sequences.
        `;

        tracklistTitleInput.value = tracklistTitle;
        tracklistTitleInput.setAttribute('data-original-value', tracklistTitle);
        
        if (coverSrc) {
            coverUrl = new URL(coverSrc, baseUrl).href;
            tracklistCoverInput.setAttribute('data-existing-file', coverUrl);
        }

        coverFileName.textContent = coverUrl || 'Select a file';
        coverFileName.classList.toggle('missing', !coverUrl);

        fileByFileInput.set(tracklistCoverInput, coverUrl);

        for (let i = 0; i < list.children.length; i++) {
            const tracklistTrack = list.children[i];
            let trackSrc = tracklistTrack.dataset.src;
            let trackUrl = new URL(trackSrc, baseUrl).href;

            setAnimationDelay('create-track-fieldset', i * 5, () => addTrackFormItem(tracklistTrack, trackUrl));
        }
    } else if (action === 'create') {
        tracklistMgrTitle.textContent = 'Create Tracklist';
        tracklistMgrDescr.textContent = 'Set up a new tracklist with ease.';

        coverFileName.textContent = 'Select a file';
        coverFileName.classList.add('missing');

        fileByFileInput.set(tracklistCoverInput, null);

        tracklistRemovalConfirm.hidden = true;
    }

    activateModalWindow(tracklistMgrWin);

    tracklistMgrWin.oninput = verifyFormData;

    tracklistMgrWin.onkeydown = (event) => {
        if (event.key === 'Enter') {
            if (event.target.matches('.file-name')) {
                const label = event.target;
                const input = document.getElementById(label.getAttribute('for'));
                if (input && input.type === 'file') input.click();
                return;
            }
            
            if (event.target.matches('input[type="text"]')) {
                if (okBtn && !okBtn.disabled) okBtn.click()
                else verifyFormData();
                return;
            }

            if (event.target.matches('.restore-button')) {
                restoreTrackFormItem(event.target);
                return;
            }
        }
    };

    tracklistMgrWin.onclick = (event) => {
        // Confirm changes
        if (event.target.closest('.ok-button')) {
            confirmTracklistManager();
            return;
        }

        if (tracklistDatabase.classList.contains('updating')) return;

        let target;

        // Add new track item
        if (event.target.closest('.add-track-form-item')) {
            addTrackFormItem(null, null, true);
            return;
        }
        // Check input file (useful if file is not selected)
        if (target = event.target.closest('input[type="file"]')) {
            validateFileSelection(target);
            return;
        }
        // Reset input state
        if (target = event.target.closest('.reset')) {
            resetInputState(target);
            return;
        }
        // Change track item order
        if (target = event.target.closest('.direction')) {
            changeTrackFormItemOrder(target);
            return;
        }
        // Remove new track item
        if (target = event.target.closest('.remove-track-form-item')) {
            removeTrackFormItem(target, event);
            return;
        }
        // Restore form of the existing track
        if (target = event.target.closest('.restore-button')) {
            restoreTrackFormItem(target);
            return;
        }
        // Cancel and hide tracklist manager
        if (
            event.target.closest('.close-button') ||
            event.target.closest('.cancel-button') ||
            (!event.target.closest('.dialog-box') && !document.getSelection().toString().length)
        ) {
            checkChangesBeforeHideTracklistManager();
            return;
        }
    };

    dropZone.ondragenter = function(event) {
        if (event.relatedTarget && event.relatedTarget.closest('.drop-zone')) return;
        dropZone.classList.add('active');
    };
    dropZone.ondragleave = function(event) {
        if (event.relatedTarget && event.relatedTarget.closest('.drop-zone')) return;
        dropZone.classList.remove('active');
    };
    dropZone.ondragover = function(event) {
        event.preventDefault();
    };
    dropZone.ondrop = function(event) {
        event.preventDefault();
        dropZone.classList.remove('active');

        let files = event.dataTransfer.files;

        for (let i = 0; i < files.length; i++) {
            if (files[i].type === 'audio/mpeg') {
                setAnimationDelay('create-track-fieldset', i * 5, () => addTrackFormItem(null, files[i]));
            } else {
                console.log('Unsupported file type:', files[i].name);
            }
        }
    };

    tracklistRemovalCheckbox.onchange = function() {
        if (this.checked) {
            tracklistMgrScrollArea.setAttribute('data-inactive', '');
            tracklistMgrWin.firstElementChild.classList.add('warning');
            disableActiveFormElements(...tracklistForm.children, ...trackForms.children);
            dropZone.classList.add('inactive');
            addTrackFormItemBtn.classList.add('inactive');
            okBtn.disabled = false;
        } else {
            tracklistMgrScrollArea.removeAttribute('data-inactive');
            tracklistMgrWin.firstElementChild.classList.remove('warning');
            enableActiveFormElements(...tracklistForm.children, ...trackForms.children);
            updateDirectionButtons();
            dropZone.classList.remove('inactive');
            addTrackFormItemBtn.classList.remove('inactive');
            verifyFormData();
        }
    };

    // Functions //

    async function addTrackFormItem(tracklistTrack, file) {
        if (!tracklistMgrWin.classList.contains('active')) return;

        trackFormItemsNum++;

        let trackStatus = tracklistTrack ? 'existing' : 'new';
        let newTrackClass = !tracklistTrack ? ' class="new-track"' : '';

        let trackFormItem = document.createElement('li');
        trackFormItem.id = `track-form-item[${trackFormItemsNum}]`;
        trackFormItem.setAttribute('data-status', trackStatus);
        trackFormItem.setAttribute('data-order', trackFormItemsNum);
        if (tracklistTrack) {
            trackFormItem.setAttribute('data-id', tracklistTrack.dataset.id);
            trackFormItem.setAttribute('data-original-order', tracklistTrack.dataset.order);
        }
        trackFormItem.innerHTML = `
            <div class="content-box">
                <fieldset${newTrackClass}>
                    <legend>Track <span class="order">${trackFormItemsNum}</span> (${trackStatus})</legend>

                    <div class="track-form">
                        <p class="form-row text">
                            <label for="input-track[${trackFormItemsNum}]-artist" class="label-text">Artist name:</label
                            ><input id="input-track[${trackFormItemsNum}]-artist" name="artist" type="text"
                                placeholder="File's tag auto-fills the empty field"
                            ><button class="reset inactive" tabindex="-1"><i class="icon-ccw"></i></button
                            ><span class="state">
                                <i class="icon-check ok" hidden></i>
                                <i class="icon-cancel fail" hidden></i>
                            </span>
                        </p>
                        <p class="form-row text">
                            <label for="input-track[${trackFormItemsNum}]-title" class="label-text">Track title:</label
                            ><input id="input-track[${trackFormItemsNum}]-title" name="title" type="text"
                                placeholder="File's tag auto-fills the empty field"
                            ><button class="reset inactive" tabindex="-1"><i class="icon-ccw"></i></button
                            ><span class="state">
                                <i class="icon-check ok" hidden></i>
                                <i class="icon-cancel fail" hidden></i>
                            </span>
                        </p>
                        <p class="form-row file">
                            <span class="label-text">Music file:</span
                            ><label for="input-track[${trackFormItemsNum}]-file" class="file-name" tabindex="0"></label
                            ><input id="input-track[${trackFormItemsNum}]-file" name="track-file" type="file"
                                accept="audio/mpeg"
                            ><button class="reset inactive" tabindex="-1"><i class="icon-ccw"></i></button
                            ><span class="state">
                                <i class="icon-check ok" hidden></i>
                                <i class="icon-cancel fail" hidden></i>
                            </span>
                        </p>
                    </div>

                    <div class="track-order-panel">
                        <button class="direction up" data-tooltip="Move track up">
                            <i class="icon-up-dir"></i>
                        </button>
                        <button class="direction down" data-tooltip="Move track down">
                            <i class="icon-down-dir"></i>
                        </button>
                    </div>
                    
                    <button class="remove-track-form-item" data-tooltip="Cancel track adding">
                        <i class="icon-minus-circled"></i>
                    </button>
                </fieldset>
            </div>
        `;

        const artistNameInput = trackFormItem.querySelector('input[name="artist"]');
        const trackTitleInput = trackFormItem.querySelector('input[name="title"]');
        const fileInput = trackFormItem.querySelector('input[name="track-file"]');

        allInputs.push(artistNameInput, trackTitleInput, fileInput);

        if (tracklistTrack) {
            let artistName = tracklistTrack.querySelector('.track-artist').textContent;
            artistNameInput.value = artistName;
            artistNameInput.setAttribute('data-original-value', artistName);

            let trackTitle = tracklistTrack.querySelector('.track-title').textContent;
            trackTitleInput.value = trackTitle;
            trackTitleInput.setAttribute('data-original-value', trackTitle);

            fileInput.setAttribute('data-existing-file', file);
        }

        if (file instanceof File) {
            await new Promise((resolve, reject) => {
                jsmediatags.read(file, {
                    onSuccess: function(tag) {
                        artistNameInput.value = tag.tags.artist;
                        trackTitleInput.value = tag.tags.title;
                        resolve();
                    },
                    onError: function(error) {
                        console.error(`Error reading file "${file.name}" tags:`, error.type, error.info);
                        reject();
                    }
                });
            }).catch(() => {});
        }

        updateFileInput(fileInput, file);

        const tooltipElems = trackFormItem.querySelectorAll('[data-tooltip]');
        tooltipElems.forEach(elem => connectTooltipHoverIntent(elem));

        trackForms.appendChild(trackFormItem);

        // Show animation
        disableActiveFormElements(trackFormItem);

        let trackFormItemHeight = trackFormItem.offsetHeight;
        trackFormItem.classList.add('show');
        trackFormItem.style.setProperty('--track-form-item-height', trackFormItemHeight + 'px');
        animationsNum++;

        requestAnimationFrame(function callback() {
            scrollToViewAnimatedElement(tracklistMgrScrollArea, trackFormItem);

            if (!tracklistMgrWin.classList.contains('active')) return;
            if (!trackFormItem.classList.contains('show')) return;
            if (trackFormItem.nextElementSibling) return;

            requestAnimationFrame(callback);
        });

        eventManager.addOnceEventListener(trackFormItem, 'animationend', () => {
            animationsNum--;

            trackFormItem.classList.remove('show');
            trackFormItem.style.removeProperty('--track-form-item-height');

            enableActiveFormElements(trackFormItem);
            updateDirectionButtons(trackFormItem);

            if (!tracklistTrack) {
                verifyFormData();
            } else if (!animationsNum) {
                setTimeout(() => {
                    tracklistMgrScrollArea.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }, 200);
            }
        });
    }

    function removeTrackFormItem(removeBtn) {
        trackFormItemsNum--;
        animationsNum++;

        const delTrackFormItem = removeBtn.closest('[id^="track-form-item"]');
        const fileInput = delTrackFormItem.querySelector('input[type="file"]');
        let delTrackFormItemOrder = Number(delTrackFormItem.dataset.order);
        let activeElem = document.activeElement;

        disableActiveFormElements(delTrackFormItem);

        let delTrackFormItemInputs = new Set(delTrackFormItem.querySelectorAll('input'));
        allInputs = allInputs.filter(input => !delTrackFormItemInputs.has(input));

        if (delTrackFormItem.dataset.status === 'existing') {
            let artist = delTrackFormItem.querySelector('input[name="artist"]').dataset.originalValue;
            let title = delTrackFormItem.querySelector('input[name="title"]').dataset.originalValue;
            let tracklistTitle = tracklistTitleInput.dataset.originalValue;

            const delInfoBox = document.createElement('div');
            delInfoBox.className = 'content-box';
            delInfoBox.innerHTML = `
                <p class="delete-info">
                    The existing track <span class="target-text quotes">${artist} – ${title}</span>
                    <span class="status-text">will be deleted</span> from the tracklist
                    <span class="target-text quotes">${tracklistTitle}</span>.
                    <span class="restore-text">
                        <button class="restore-button inactive" tabindex="-1">Restore</button> the form.
                    </span>
                </p>
            `;
            delTrackFormItem.appendChild(delInfoBox);
            
            let delInfoBoxHeight = delInfoBox.offsetHeight;
            delInfoBox.classList.add('expand');
            delInfoBox.style.position = 'absolute';
            delInfoBox.style.setProperty('--content-box-height', delInfoBoxHeight + 'px');

            eventManager.addOnceEventListener(delInfoBox, 'animationend', () => {
                if (!delInfoBox.classList.contains('expand')) return;
                completeAnimationSequence();
            });

            const fieldsetBox = delTrackFormItem.firstElementChild;
            let fieldsetBoxHeight = fieldsetBox.offsetHeight;
            fieldsetBox.style.height = fieldsetBoxHeight + 'px';
            fieldsetBox.classList.add('collapse');
            fieldsetBox.style.setProperty('--content-box-height', delInfoBoxHeight + 'px');

            eventManager.addOnceEventListener(fieldsetBox, 'animationend', () => {
                if (!fieldsetBox.classList.contains('collapse')) return;
                completeAnimationSequence();
            });

            function completeAnimationSequence() {
                animationsNum--;

                delInfoBox.classList.remove('expand');
                delInfoBox.style.position = '';
                delInfoBox.style.removeProperty('--content-box-height');

                fieldsetBox.classList.remove('collapse');
                fieldsetBox.style.height = '';
                fieldsetBox.style.removeProperty('--content-box-height');

                delTrackFormItem.setAttribute('data-status', 'removed');
                delTrackFormItem.setAttribute('data-order', 'none');
                delTrackFormItem.removeAttribute('id');

                let file = fileByFileInput.get(fileInput);
                fileByFileInput.set(delInfoBox.firstElementChild, file);
                fileByFileInput.delete(fileInput);

                let delTrackId = delTrackFormItem.dataset.id;
                let fragmentFieldsetBox = document.createDocumentFragment();
                fragmentFieldsetBox.appendChild(fieldsetBox);
                delTrackFieldsetById.set(delTrackId, fragmentFieldsetBox);

                enableActiveFormElements(delTrackFormItem);

                if (activeElem === removeBtn) delInfoBox.querySelector('.restore-button').focus();

                reCalcTrackFormItemsOrder();
                verifyFormData(); // After reordering
            }
        } else if (delTrackFormItem.dataset.status === 'new') {
            let fixedHeight = delTrackFormItem.offsetHeight;
            delTrackFormItem.style.height = fixedHeight + 'px';
            delTrackFormItem.classList.add('hide');

            eventManager.addOnceEventListener(delTrackFormItem, 'animationend', () => {
                animationsNum--;

                fileByFileInput.delete(fileInput);
                
                const prevTrackFormItem = delTrackFormItem.previousElementSibling;
                const nextTrackFormItem = delTrackFormItem.nextElementSibling;

                delTrackFormItem.remove();

                if (nextTrackFormItem) {
                    updateDirectionButtons(nextTrackFormItem);
                    if (activeElem === removeBtn) nextTrackFormItem.querySelector('.remove-track-form-item').focus();
                } else if (prevTrackFormItem) {
                    updateDirectionButtons(prevTrackFormItem);
                    if (activeElem === removeBtn) prevTrackFormItem.querySelector('.remove-track-form-item').focus();
                } else {
                    if (activeElem === removeBtn) addTrackFormItemBtn.focus();
                }

                reCalcTrackFormItemsOrder();
                verifyFormData(); // After reordering
            });
        }

        function reCalcTrackFormItemsOrder() {
            [].forEach.call(trackForms.children, trackFormItem => {
                if (trackFormItem.dataset.status === 'removed') return;
    
                let trackFormItemOrder = Number(trackFormItem.dataset.order);
                if (trackFormItemOrder < delTrackFormItemOrder) return;
    
                let newOrder = trackFormItemOrder - 1;
                setTrackFormItemOrder(trackFormItem, newOrder);
            });
        }
    }

    function restoreTrackFormItem(restoreBtn) {
        trackFormItemsNum++;
        animationsNum++;

        const resTrackFormItem = restoreBtn.closest('[data-status="removed"]');
        const delInfoBox = resTrackFormItem.firstElementChild;
        let file = fileByFileInput.get(delInfoBox.firstElementChild);
        let activeElem = document.activeElement;

        restoreBtn.classList.add('inactive');
        restoreBtn.removeAttribute('tabindex');
        restoreBtn.blur();

        let delInfoBoxHeight = delInfoBox.offsetHeight;
        delInfoBox.style.height = delInfoBoxHeight + 'px';
        delInfoBox.classList.add('collapse');
        delInfoBox.style.position = 'absolute';

        eventManager.addOnceEventListener(delInfoBox, 'animationend', () => delInfoBox.remove());

        let resTrackId = resTrackFormItem.dataset.id;
        let fragmentFieldsetBox = delTrackFieldsetById.get(resTrackId);
        const fieldsetBox = fragmentFieldsetBox.firstElementChild;
        delTrackFieldsetById.delete(resTrackId);
        resTrackFormItem.appendChild(fragmentFieldsetBox);

        let fieldsetBoxHeight = fieldsetBox.offsetHeight;
        fieldsetBox.classList.add('expand');
        fieldsetBox.style.height = delInfoBoxHeight + 'px';
        fieldsetBox.style.setProperty('--content-box-height', fieldsetBoxHeight + 'px');

        requestAnimationFrame(function callback() {
            scrollToViewAnimatedElement(tracklistMgrScrollArea, resTrackFormItem);

            if (!tracklistMgrWin.classList.contains('active')) return;
            if (!fieldsetBox.classList.contains('expand')) return;

            requestAnimationFrame(callback);
        });

        eventManager.addOnceEventListener(fieldsetBox, 'animationend', () => {
            animationsNum--;

            fieldsetBox.classList.remove('expand');
            fieldsetBox.style.height = '';
            fieldsetBox.style.removeProperty('--content-box-height');

            resTrackFormItem.setAttribute('data-status', 'existing');

            const fileInput = fieldsetBox.querySelector('input[type="file"]');
            fileByFileInput.set(fileInput, file);
            fileByFileInput.delete(delInfoBox.firstElementChild);

            enableActiveFormElements(resTrackFormItem);
            updateDirectionButtons(resTrackFormItem);

            allInputs.push(...resTrackFormItem.querySelectorAll('input'));

            const trackFormItems = Array.from(trackForms.children);
            let resTrackFormItemIdx = trackFormItems.indexOf(resTrackFormItem);
            let prevTrackFormItemIdx = trackFormItems
                .slice(0, resTrackFormItemIdx)
                .findLastIndex(trackFormItem => trackFormItem.dataset.status !== 'removed');
            let resOrder = prevTrackFormItemIdx >= 0 ? Number(trackFormItems[prevTrackFormItemIdx].dataset.order) + 1 : 1;

            for (let i = resTrackFormItemIdx; i < trackFormItems.length; i++) {
                if (trackFormItems[i].dataset.status === 'removed') continue;

                let curOrder = Number(trackFormItems[i].dataset.order);
                let newOrder = (trackFormItems[i] === resTrackFormItem) ? resOrder : curOrder + 1;
                setTrackFormItemOrder(trackFormItems[i], newOrder);
            }

            if (activeElem === restoreBtn) resTrackFormItem.querySelector('input').focus();

            verifyFormData(); // After reordering
        });
    }

    function changeTrackFormItemOrder(dirBtn) {
        if (animationsNum) return;

        let direction = dirBtn.classList.contains('up') ? 'up' : 'down';
        let activeElem = document.activeElement;

        const movedTrackFormItem = dirBtn.closest('[id^="track-form-item"]');
        const swapTrackFormItem = (direction === 'up') ?
            movedTrackFormItem.previousElementSibling :
            movedTrackFormItem.nextElementSibling;

        if (!swapTrackFormItem) return;

        animationsNum++;

        disableActiveFormElements(movedTrackFormItem, swapTrackFormItem);

        let heightDifference = (direction === 'up')?
            movedTrackFormItem.offsetHeight - swapTrackFormItem.offsetHeight :
            swapTrackFormItem.offsetHeight - movedTrackFormItem.offsetHeight;

        trackForms.style.setProperty('--track-form-items-height-difference', `${heightDifference}px`);

        movedTrackFormItem.classList.add(`move-${direction}`);
        swapTrackFormItem.classList.add(`move-${direction === 'up' ? 'down' : 'up'}`);

        eventManager.addOnceEventListener(movedTrackFormItem, 'animationend', () => {
            animationsNum--;

            if (direction === 'up') {
                swapTrackFormItem.before(movedTrackFormItem);
            } else {
                swapTrackFormItem.after(movedTrackFormItem);
            }

            movedTrackFormItem.classList.remove('move-up', 'move-down');
            swapTrackFormItem.classList.remove('move-up', 'move-down');
            trackForms.style.removeProperty('--track-form-items-height-difference');

            enableActiveFormElements(movedTrackFormItem, swapTrackFormItem);
            updateDirectionButtons(movedTrackFormItem);
    
            if (swapTrackFormItem.dataset.status !== 'removed') {
                let movedTrackFormItemOrder = Number(movedTrackFormItem.dataset.order);
                let swapTrackFormItemOrder = Number(swapTrackFormItem.dataset.order);
    
                setTrackFormItemOrder(movedTrackFormItem, swapTrackFormItemOrder);
                setTrackFormItemOrder(swapTrackFormItem, movedTrackFormItemOrder);
            }

            verifyFormData(); // After reordering
    
            if (activeElem === dirBtn) {
                if (!dirBtn.classList.contains('inactive')) {
                    dirBtn.focus();
                } else {
                    let activeDirBtn = movedTrackFormItem.querySelector('.direction:not(.inactive)');
                    activeDirBtn?.focus();
                }
            }
        });
    }

    function setTrackFormItemOrder(trackFormItem, order) {
        const legendOrder = trackFormItem.querySelector('legend > .order');
        let origOrder = trackFormItem.dataset.originalOrder;

        trackFormItem.id = `track-form-item[${order}]`;
        trackFormItem.dataset.order = order;
        legendOrder.textContent = order;
        if (origOrder) legendOrder.classList.toggle('changed', Number(origOrder) !== order);

        trackFormItem.querySelectorAll('input').forEach(input => {
            let oldInputId = input.id;
            let newInputId = oldInputId.replace(/\[\d+\]/, `[${order}]`);
            input.parentElement.querySelector(`label[for="${oldInputId}"]`).htmlFor = newInputId;
            input.id = newInputId;
        });
    }

    function updateDirectionButtons(selTrackFormItem = null) {
        if (tracklistMgrScrollArea.hasAttribute('data-inactive')) return;

        if (selTrackFormItem) {
            const prevTrackFormItem = selTrackFormItem.previousElementSibling;
            const nextTrackFormItem = selTrackFormItem.nextElementSibling;
    
            for (let trackFormItem of [prevTrackFormItem, selTrackFormItem, nextTrackFormItem]) {
                if (!trackFormItem || trackFormItem.dataset.status === 'removed') continue;
                refreshButtonsActivity(trackFormItem);
            };
        } else {
            for (let trackFormItem of trackForms.children) {
                if (trackFormItem.dataset.status === 'removed') continue;
                refreshButtonsActivity(trackFormItem);
            }
        }

        function refreshButtonsActivity(trackFormItem) {
            const upDirBtn = trackFormItem.querySelector('.direction.up');
            let isFirst = trackFormItem === trackForms.firstElementChild;
            upDirBtn.classList.toggle('inactive', isFirst);
            upDirBtn.setAttribute('tabindex', isFirst ? -1: 0);

            const downDirBtn = trackFormItem.querySelector('.direction.down');
            let isLast = trackFormItem === trackForms.lastElementChild;
            downDirBtn.classList.toggle('inactive', isLast);
            downDirBtn.setAttribute('tabindex', isLast ? -1: 0);
        }
    }

    function validateFileSelection(fileInput) {
        eventManager.addOnceEventListener(window, 'blur', runFileValidation);

        function runFileValidation() {
            resetPostDialogSelectionTimer(fileInput);

            eventManager.addOnceEventListener(window, 'focus', processFileSelection);

            function processFileSelection() {
                let timerFileInput = setTimeout(() => {
                    resetPostDialogSelectionTimer(fileInput);

                    if (!fileInput.files[0]) {
                        fileByFileInput.set(fileInput, null);
                        verifyFormData();
                    }
                }, 100); 

                postDialogSelectionTimers.set(fileInput, timerFileInput);
            }
        }
    }

    async function checkFileSelection(fileInput) {
        eventManager.removeOnceEventListener(window, 'blur', 'runFileValidation');
        eventManager.removeOnceEventListener(window, 'focus', 'processFileSelection');

        let file = fileInput.files[0];

        if (file) {
            resetPostDialogSelectionTimer(fileInput);
            if (fileInput.matches('[accept^="audio"]')) await extractFileTags(fileInput, file);
            return false;
        } else {
            return !!postDialogSelectionTimers.size;
        }

        function extractFileTags(fileInput, file) {
            return new Promise((resolve, reject) => {
                jsmediatags.read(file, {
                    onSuccess: function(tag) {
                        const trackForm = fileInput.closest('.track-form');
                        const artistNameInput = trackForm.querySelector('input[name="artist"]');
                        const trackTitleInput = trackForm.querySelector('input[name="title"]');
                        if (!artistNameInput.value.length) artistNameInput.value = tag.tags.artist;
                        if (!trackTitleInput.value.length) trackTitleInput.value = tag.tags.title;
                        resolve();
                    },
                    onError: function(error) {
                        console.error(`Error reading file "${file.name}" tags:`, error.type, error.info);
                        reject();
                    }
                });
            }).catch(() => {});
        }
    }

    function resetPostDialogSelectionTimer(fileInput) {
        clearTimeout(postDialogSelectionTimers.get(fileInput));
        postDialogSelectionTimers.delete(fileInput);
    }

    async function verifyFormData(event) {
        // Prevents duplicate verification
        if (animationsNum) return;
        if (event?.target.matches('.tracklist-removal-confirm input[type="checkbox"]')) return;
        if (event?.target.matches('input[type="file"]')) {
            let noSelectionInFileDialog = await checkFileSelection(event.target);
            if (noSelectionInFileDialog) return;
        }
        
        validateAllInputs();

        if (tracklistMgrScrollArea.hasAttribute('data-inactive')) return;

        let isWarning = allInputs.some(input => input.classList.contains('warning'));
        let isFormChanged = isWarning ? false : checkFormChanges(trackForms, allInputs);

        okBtn.disabled = isWarning || !isFormChanged;
    }

    function validateAllInputs() {
        return allInputs.forEach(input => {
            switch (input.type) {
                case 'text':
                    validateTextInput(input);
                    return;
                case 'file':
                    validateFileInput(input);
                    return;
                default:
                    console.log('Unknown input type: ' + input.type);
                    return false;
            }
        });
    }

    function validateTextInput(textInput) {
        let origValue = correctText(textInput.dataset.originalValue || '');
        let curValue = correctText(textInput.value);
        let isSame = curValue === origValue;
        let isValid = false;
        
        if (curValue) {
            if (textInput === tracklistTitleInput) { // Tracklist title
                isValid = ![...tracklistsMapData.values()]
                    .some(data => data.tracklistTitle === curValue && data.tracklistTitle !== origValue);
            } else { // Artist name and track title
                isValid = true;
            }
        }
        
        updateInputState(textInput, !isSame);
        
        textInput.classList.toggle('warning', !isValid);
        textInput.parentElement.querySelector('.ok').hidden = !isValid || isSame;
        textInput.parentElement.querySelector('.fail').hidden = isValid;
    }

    function validateFileInput(fileInput) {
        let existingFile = fileInput.dataset.existingFile || null;
        let file = fileInput.files[0] ||
            (fileByFileInput.has(fileInput) ? fileByFileInput.get(fileInput) : existingFile);
        let isSame = file === existingFile;

        updateFileInput(fileInput, file);
        updateInputState(fileInput, !isSame);
    
        if (!fileInput.hasAttribute('data-optional')) {
            fileInput.classList.toggle('warning', !file);
            fileInput.parentElement.querySelector('.ok').hidden = !file || isSame;
            fileInput.parentElement.querySelector('.fail').hidden = !!file;
        }
    }

    function updateFileInput(fileInput, file) {
        fileByFileInput.set(fileInput, file);

        const fileName = fileInput.parentElement.querySelector('.file-name');
        fileName.textContent = file instanceof File ? file.name : (file || 'Select a file');
        fileName.classList.toggle('missing', !file);
    }

    function resetInputState(resetBtn) {
        const input = resetBtn.parentElement.querySelector('input');
        
        switch (input.type) {
            case 'text':
                input.value = input.dataset.originalValue || '';
                input.focus();
                break;
            case 'file':
                input.value = '';

                let existingFile = input.dataset.existingFile || null;
                fileByFileInput.set(input, existingFile);

                const fileName = input.parentElement.querySelector('.file-name');
                fileName.focus();
                break;
            default:
                console.log('Unknown input type: ' + input.type);
                break;
        }

        updateInputState(input, false);
        verifyFormData();
    }

    function updateInputState(input, isValueChanged) {
        input.toggleAttribute('data-value-changed', isValueChanged);

        const resetBtn = input.parentElement.querySelector('.reset');
        resetBtn.classList.toggle('inactive', !isValueChanged);
        resetBtn.setAttribute('tabindex', isValueChanged ? 0 : -1);
    }

    function disableActiveFormElements(...trackFormItems) {
        const selector = 'fieldset.new-track, legend > .order, input, .file-name, .reset, .state > i, .direction,\
            .remove-track-form-item, .restore-button';

        trackFormItems.forEach(formBox => {
            formBox.querySelectorAll(selector).forEach(elem => {
                elem.classList.add('inactive');

                if (elem.matches('input')) {
                    elem.disabled = true;
                } else {
                    if (elem.matches('.restore-button') && dataUpdateStatus === 'preparing') {
                        elem.parentElement.remove();
                    } else if (elem.tabIndex >= 0) { // Works on default focused elements
                        elem.setAttribute('tabindex', -1);
                        elem.blur();
                    }
                }
            });
        });
    }

    function enableActiveFormElements(...trackFormItems) {
        if (tracklistMgrScrollArea.hasAttribute('data-inactive')) return;

        const selector = 'fieldset.new-track, legend > .order, input, .file-name, .state > i, .remove-track-form-item,\
            .restore-button';

        trackFormItems.forEach(formBox => {
            formBox.querySelectorAll(selector).forEach(elem => {
                elem.classList.remove('inactive');

                if (elem.matches('input')) {
                    elem.disabled = false;
                } else {
                    if (elem.hasAttribute('tabindex')) elem.setAttribute('tabindex', 0);
                }
            });
        });
    }

    async function confirmTracklistManager() {
        const trackFormItems = Array.from(trackForms.children);
        let shouldFocusTracklistSection = !!savedActiveElem;
        let shouldDeleteTracklist = !tracklistRemovalConfirm.hidden && tracklistRemovalCheckbox.checked;
        let hasTracklistDataChanged = tracklistTitleInput.hasAttribute('data-value-changed') ||
            tracklistCoverInput.hasAttribute('data-value-changed');
        
        if (dataUpdateStatus === 'data collection') {
            if (tracklistMgrWin.hasAttribute('data-waiting')) return;

            tracklistMgrWin.setAttribute('data-waiting', '');

            if (shouldDeleteTracklist) {
                tracklistForm.classList.add('deleting');
                removeAllTrackFormItems();
            }
        
            let errorOccurred = await waitAnimationsAndTimersToComplete();
            if (errorOccurred || okBtn.disabled || !tracklistMgrWin.classList.contains('active')) return;

            console.log(`%c${action} tracklist "${
                correctText(tracklistTitleInput.dataset.originalValue || tracklistTitleInput.value)
            }"`, `
                color: #fafafa;
                background-color: rgba(0, 38, 255, 0.9);
            `);
            
            tracklistDatabase.classList.add('updating');

            dataUpdateStatus = 'preparing';
            prepareUpdating();
            createUploadProgressIndicators();
            dataUpdateStatus = 'in progress';

            const statusUpdater = {
                success: function() {
                    console.log(
                        shouldDeleteTracklist ? 'The tracklist was successfully deleted' : 'All updates are successful'
                    );
                    dataUpdateStatus = 'success';
                },
                partial: function() {
                    console.log('The update has been partially completed');
                    dataUpdateStatus = 'partial';
                },
                error: function() {
                    console.log(
                        shouldDeleteTracklist ? 'The tracklist deletion has failed' : 'The update has failed'
                    );
                    dataUpdateStatus = 'error';
                }
            };

            if (shouldDeleteTracklist) {
                let isTracklistDeleted = await deleteTracklist();
                statusUpdater[isTracklistDeleted ? 'success' : 'error']();
                if (isTracklistDeleted) {
                    trackStates = { successful: new Map(tracklistData.tracks.map(trackData => [trackData.id, 'deleted'])) };
                }
            } else {
                let isTracklistUpdated = await updateTracklistData();
    
                if (isTracklistUpdated) {
                    trackStates = await updateTracksData();
                    if (!totalUploadRow.hidden) updateTotalUploadProgress(true);
                    
                    console.log(trackStates);

                    if (!trackStates.rejected.length) {
                        statusUpdater.success();
                    } else if (trackStates.successful.size || hasTracklistDataChanged) {
                        statusUpdater.partial();
                    } else {
                        statusUpdater.error();
                    }
                } else {
                    statusUpdater.error();
                }
            }

            updateTracklistsMapData(); // Temporary code
            okBtn.disabled = false;
            return;
        }
        
        if (dataUpdateStatus === 'success' || dataUpdateStatus === 'partial') {
            hideTracklistManager();
            await new Promise(resolve => eventManager.addOnceEventListener(tracklistMgrWin, 'transitionend', resolve));
            updatePlaylistTracks();
            updateTracklistDatabase();
            return;
        }
        
        if (dataUpdateStatus === 'error') {
            hideTracklistManager();
            await new Promise(resolve => eventManager.addOnceEventListener(tracklistMgrWin, 'transitionend', resolve));
            finalizeTracklistDatabaseUpdating();
            return;
        }

        // Functions //

        function removeAllTrackFormItems() {
            trackFormItems.forEach(trackFormItem => {
                if (trackFormItem.dataset.status === 'removed') return;

                const removeBtn = trackFormItem.querySelector('.remove-track-form-item');
                removeTrackFormItem(removeBtn);
            });
        }

        function waitAnimationsAndTimersToComplete() {
            return new Promise((resolve, reject) => {
                checkAnimationsAndTimers();

                function checkAnimationsAndTimers() {
                    if (!animationsNum && !postDialogSelectionTimers.size) {
                        tracklistMgrWin.removeAttribute('data-waiting');
                        resolve();
                    } else {
                        if (tracklistMgrWin.classList.contains('active')) {
                            setTimeout(checkAnimationsAndTimers, 50);
                        } else {
                            reject(new Error('Tracklist manager was closed before the \
                                pending operations were completed'));
                        }
                    }
                }
            });
        }

        function prepareUpdating() {
            disableActiveFormElements(...tracklistForm.children, ...trackFormItems);
            dropZone.hidden = true;
            tracklistRemovalCheckbox.disabled = true;
            okBtn.disabled = true;
            cancelBtn.disabled = true;
            closeBtn.disabled = true;
        }

        function createUploadProgressIndicators() {
            for (let [input, file] of fileByFileInput.entries()) {
                if (input.hasAttribute('data-value-changed') && file instanceof File) {
                    const uploadFormRow = createUploadFormRow();
                    input.parentElement.after(uploadFormRow);
                    uploadProgressByUploadFormRow.set(uploadFormRow, 0);
                }
            }

            if (uploadProgressByUploadFormRow.size) totalUploadRow.hidden = false;

            function createUploadFormRow() {
                let uploadFormRow = document.createElement('div');
                uploadFormRow.className = 'form-row upload';
                uploadFormRow.innerHTML = `
                    <span class="label-text">Upload progress:</span
                    ><div class="upload-range">
                        <div class="upload-progress"></div>
                    </div
                    ><span class="display-progress">0%</span
                    ><span class="state">
                        <i class="icon-check ok" hidden></i>
                        <i class="icon-cancel fail" hidden></i>
                    </span>
                `;
                return uploadFormRow;
            }
        }

        function deleteTracklist() {
            console.log('+ del tracklist');
    
            /*return fetch('/api/tracklists?tracklistId=' + encodeURIComponent(tracklistId), {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Server responded with status: ' + response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Tracklist deletion success:', data);
                    tracklistsMapData = data.tracklistsMapData;
                    tracklistForm.classList.remove('deleting');
                    tracklistForm.classList.add('success-deleted');
                    trackFormItems.forEach(trackFormItem => {
                        trackFormItem.classList.add('success');
                        trackFormItem.querySelector('.status-text').textContent = 'has been deleted';
                    });
                    return true;
                })
                .catch(error => {
                    console.error('Tracklist deletion error:', error);
                    tracklistForm.classList.remove('deleting');
                    tracklistForm.classList.add('error');
                    trackFormItems.forEach(trackFormItem => {
                        trackFormItem.classList.add('error');
                        trackFormItem.querySelector('.status-text').textContent = 'has not been deleted';
                    });
                    return false;
                })
            ;*/
    
            // Temporary code
            return new Promise(resolve => setTimeout(() => {
                tracklistForm.classList.remove('deleting');
                tracklistForm.classList.add('success-deleted');
                trackFormItems.forEach(trackFormItem => {
                    trackFormItem.classList.add('success');
                    trackFormItem.querySelector('.status-text').textContent = 'has been deleted';
                });
                resolve(true);
            }, 1e3));
        }

        function updateTracklistData() {
            console.log('update tracklist');

            const tracklistFormData = new FormData();
            
            if (tracklistTitleInput.hasAttribute('data-value-changed')) {
                tracklistFormData.append(tracklistTitleInput.name, correctText(tracklistTitleInput.value));
            }

            if (tracklistCoverInput.hasAttribute('data-value-changed')) {
                tracklistFormData.append(tracklistCoverInput.name, fileByFileInput.get(tracklistCoverInput));
            }

            if ([...tracklistFormData.entries()].length) {
                tracklistFormData.append('form', 'tracklist');
                tracklistFormData.append('action', action);
                if (action === 'edit') tracklistFormData.append('tracklistId', tracklistId);

                /*return new Promise((resolve, reject) => {
                    let xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/tracklists');
                    xhr.responseType = 'json';

                    const trlUploadFormRow = tracklistForm.querySelector('.form-row.upload');

                    if (trlUploadFormRow && uploadProgressByUploadFormRow.has(trlUploadFormRow)) {
                        const trlUploadProgress = trlUploadFormRow.querySelector('.upload-progress');
                        const trlDisplayProgress = trlUploadFormRow.querySelector('.display-progress');

                        xhr.upload.onprogress = function(event) {
                            if (xhr.readyState < 2) return;

                            if (event.lengthComputable) {
                                let progress = (event.loaded / event.total) * 100;
                                
                                trlUploadProgress.style.width = progress + '%';
                                trlDisplayProgress.textContent = Math.floor(progress) + '%';

                                uploadProgressByUploadFormRow.set(trlUploadFormRow, progress);
                                updateTotalUploadProgress(false);
                            } else {
                                console.error('The size of the upload cannot be determined');
                            }
                        };
                    }

                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            let data = xhr.response;

                            console.log('Tracklist update successful:', data);

                            tracklistForm.classList.add('success');
                            if (trlUploadFormRow) trlUploadFormRow.querySelector('.state > .ok').hidden = false;

                            tracklistsMapData = data.tracklistsMapData;
                            if (action === 'create') {
                                tracklistId = data.tracklistId;
                                tracklistData = tracklistsMapData.get(tracklistId);
                            }

                            resolve();
                        } else {
                            let error = { [xhr.status]: xhr.statusText };
                            handleXhrError('Tracklist update error:', error);
                        }
                    };

                    xhr.onerror = function() {
                        handleXhrError('The request could not be completed due to a network error');
                    };

                    xhr.send(tracklistFormData);

                    function handleXhrError(errorMessage, error) {
                        console.error(errorMessage, error || '');

                        tracklistForm.classList.add('error');
                        if (trlUploadFormRow) trlUploadFormRow.querySelector('.state > .fail').hidden = false;
                        if (!totalUploadRow.hidden) updateTotalUploadProgress(true);

                        trackFormItems.forEach(trackFormItem => {
                            if (trackFormItem.dataset.status === 'removed') {
                                trackFormItem.classList.add('error');
                                trackFormItem.querySelector('.status-text').textContent = 'has not been deleted';
                            } else {
                                let orderChanged = trackFormItem.dataset.order !== trackFormItem.dataset.originalOrder;
                                let inputChanged = Array.from(trackFormItem.querySelectorAll('input'))
                                    .some(input => input.hasAttribute('data-value-changed'));
        
                                if (orderChanged || inputChanged) trackFormItem.classList.add('error');

                                const trackUploadFormRow = trackFormItem.querySelector('.form-row.upload');
                                if (trackUploadFormRow) trackUploadFormRow.querySelector('.state > .fail').hidden = false;
                            }
                        });

                        reject();
                    }
                }).then(
                    () => true,
                    () => false
                );*/

                return new Promise(resolve => {
                    const trlUploadFormRow = tracklistForm.querySelector('.form-row.upload');

                    if (trlUploadFormRow && uploadProgressByUploadFormRow.has(trlUploadFormRow)) {
                        const trlUploadProgress = trlUploadFormRow.querySelector('.upload-progress');
                        const trlDisplayProgress = trlUploadFormRow.querySelector('.display-progress');
                        let duration = randomNumber(1000, 5000).toFixed(0);
                        let startTime = performance.now();

                        console.log('cover file duration = ' + duration);
    
                        requestAnimationFrame(function callback(time) {
                            let progress = Math.min((time - startTime) / duration, 1) * 100;
    
                            trlUploadProgress.style.width = progress + '%';
                            trlDisplayProgress.textContent = Math.floor(progress) + '%';

                            uploadProgressByUploadFormRow.set(trlUploadFormRow, progress);
                            updateTotalUploadProgress(false);
    
                            if (progress >= 100) {
                                resolve(endUploading());
                            } else {
                                requestAnimationFrame(callback);
                            }
                        });
                    } else {
                        resolve(endUploading());
                    }

                    function endUploading() {
                        if (action === 'create') {
                            tracklistId = crypto.randomUUID();
                            tracklistData = {};
                            tracklistsMapData.set(tracklistId, tracklistData);
                        }
                        tracklistForm.classList.add('success');
                        if (trlUploadFormRow) trlUploadFormRow.querySelector('.state > .ok').hidden = false;
                        return true;
                    }
                });
            } else {
                console.log('No updates for tracklist');
                return true;
            }
        }

        function updateTracksData() {
            console.log('update tracks');

            const taskPromises = trackFormItems.map(uploadTrackFormData);

            return Promise.allSettled(taskPromises)
                .then(results => {
                    let statesData = {
                        successful: new Map(),
                        rejected: []
                    };

                    results.forEach(({ status, value, reason }) => {
                        if (status === 'fulfilled' && value) {
                            let { trackId, trackState } = value;
                            statesData.successful.set(trackId, trackState);
                        } else if (status === 'rejected') {
                            statesData.rejected.push(reason);
                        }
                    });

                    return statesData;
                });

            function uploadTrackFormData(trackFormItem) {
                let trackId = trackFormItem.dataset.id;
                let trackOrder = trackFormItem.dataset.order;

                if (trackFormItem.dataset.status === 'removed') {
                    /*return fetch('/api/tracks?trackId=' + encodeURIComponent(trackId), {
                        method: 'DELETE'
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('Server responded with status: ' + response.status);
                            return response.json();
                        })
                        .then(data => {
                            console.log('Track ${trackOrder} deletion successful:', data);
                            tracklistsMapData = data.tracklistsMapData;
                            trackFormItem.classList.add('success');
                            trackFormItem.querySelector('.status-text').textContent = 'has been deleted';
                            return { trackId, trackState: 'deleted' };
                        })
                        .catch(error => {
                            console.error('Track ${trackOrder} deletion error:', error);
                            trackFormItem.classList.add('error');
                            trackFormItem.querySelector('.status-text').textContent = 'has not been deleted';
                            return Promise.reject({ trackId, trackState: 'deleted', error });
                        })
                    ;*/

                    // Temporary code
                    return new Promise(resolve => setTimeout(() => {
                        trackFormItem.classList.add('success');
                        trackFormItem.querySelector('.status-text').textContent = 'has been deleted';
                        resolve({ trackId, trackState: 'deleted' });
                    }, 1e3));
                } else {
                    const trackFormData = new FormData();

                    if (trackOrder !== trackFormItem.dataset.originalOrder) {
                        trackFormData.append('order', trackOrder);
                    }

                    trackFormItem.querySelectorAll('input').forEach(input => {
                        if (input.hasAttribute('data-value-changed')) {
                            switch (input.type) {
                                case 'text':
                                    trackFormData.append(input.name, correctText(input.value));
                                    return;
                                case 'file':
                                    trackFormData.append(input.name, fileByFileInput.get(input));
                                    return;
                                default:
                                    console.log('Unknown input type: ' + input.type);
                                    return;
                            }
                        }
                    });

                    if ([...trackFormData.entries()].length) {
                        let trackStatus = trackFormItem.dataset.status;
                        let isExisting = trackStatus === 'existing';
                        let trackState = isExisting ? 'updated' : 'created';

                        trackFormData.append('form', 'track');
                        trackFormData.append('status', trackStatus);
                        trackFormData.append('tracklistId', tracklistId);
                        if (isExisting) trackFormData.append('trackId', trackId);

                        /*return new Promise((resolve, reject) => {
                            let xhr = new XMLHttpRequest();
                            let method = isExisting ? 'PATCH' : 'POST';
                            xhr.open(method, '/api/tracks');
                            xhr.responseType = 'json';

                            const trackUploadFormRow = trackFormItem.querySelector('.form-row.upload');

                            if (trackUploadFormRow && uploadProgressByUploadFormRow.has(trackUploadFormRow)) {
                                const trackUploadProgress = trackUploadFormRow.querySelector('.upload-progress');
                                const trackDisplayProgress = trackUploadFormRow.querySelector('.display-progress');

                                xhr.upload.onprogress = function(event) {
                                    if (xhr.readyState < 2) return;

                                    if (event.lengthComputable) {
                                        let progress = (event.loaded / event.total) * 100;
                                        
                                        trackUploadProgress.style.width = progress + '%';
                                        trackDisplayProgress.textContent = Math.floor(progress) + '%';
    
                                        uploadProgressByUploadFormRow.set(trackUploadFormRow, progress);
                                        updateTotalUploadProgress(false);
                                    } else {
                                        console.error('The size of the upload cannot be determined');
                                    }
                                };
                            }

                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    let data = xhr.response;

                                    console.log(`Track ${trackOrder} ${isExisting ? 'update' : 'creation'} successful:`,
                                        data);

                                    trackFormItem.classList.add('success');
                                    if (trackUploadFormRow) trackUploadFormRow.querySelector('.state > .ok').hidden = false;

                                    tracklistsMapData = data.tracklistsMapData;

                                    resolve({ trackId: isExisting ? trackId : data.trackId, trackState });
                                } else {
                                    let error = { [xhr.status]: xhr.statusText };
                                    handleError(`Track ${trackOrder} ${isExisting ? 'update' : 'creation'} error:`, error);
                                }
                            };

                            xhr.onerror = function() {
                                handleError('The request could not be completed due to a network error');
                            };

                            xhr.send(trackFormData);

                            function handleError(errorMessage, error) {
                                console.error(errorMessage, error || '');

                                trackFormItem.classList.add('error');
                                if (trackUploadFormRow) trackUploadFormRow.querySelector('.state > .fail').hidden = false;

                                reject(trackId ? { trackId, trackState, error } : { trackOrder, trackState, error });
                            }
                        });*/

                        // Temporary code
                        return new Promise(resolve => {
                            const trackUploadFormRow = trackFormItem.querySelector('.form-row.upload');

                            if (trackUploadFormRow && uploadProgressByUploadFormRow.has(trackUploadFormRow)) {
                                const trackUploadProgress = trackUploadFormRow.querySelector('.upload-progress');
                                const trackDisplayProgress = trackUploadFormRow.querySelector('.display-progress');
                                let duration = randomNumber(3000, 12000).toFixed(0);
                                let startTime = performance.now();

                                console.log('music file duration = ' + duration);
    
                                requestAnimationFrame(function callback(time) {
                                    let progress = Math.min((time - startTime) / duration, 1) * 100;
    
                                    trackUploadProgress.style.width = progress + '%';
                                    trackDisplayProgress.textContent = Math.floor(progress) + '%';

                                    uploadProgressByUploadFormRow.set(trackUploadFormRow, progress);
                                    updateTotalUploadProgress(false);
    
                                    if (progress >= 100) {
                                        resolve(endUploading());
                                    } else {
                                        requestAnimationFrame(callback);
                                    }
                                });
                            } else {
                                resolve(endUploading());
                            }

                            function endUploading() {
                                trackFormItem.classList.add('success');
                                if (trackUploadFormRow) trackUploadFormRow.querySelector('.state > .ok').hidden = false;
                                return { trackId: isExisting ? trackId : crypto.randomUUID(), trackState };
                            }
                        });
                    } else  if (action === 'edit' && tracklistTitleInput.hasAttribute('data-value-changed')) {
                        return Promise.resolve({ trackId, trackState: 'updated' });
                    } else {
                        console.log(`No updates for track ${trackOrder}`);
                        return Promise.resolve();
                    }
                }
            }
        }

        if (tracklistTitleInput.hasAttribute('data-value-changed')) {
            trackFormData.append('tracklistTitle', correctText(tracklistTitleInput.value));
        }

        function updateTotalUploadProgress(isFinal) {
            let totalProgress = Array.from(uploadProgressByUploadFormRow.values())
                .reduce((sum, val) => sum += val, 0) / uploadProgressByUploadFormRow.size;

            totalUploadProgress.style.width = totalProgress + '%';
            totalDisplayProgress.textContent = Math.floor(totalProgress) + '%';

            if (!isFinal) return;

            let completeIconClass = totalProgress >= 100 ? 'ok' : 'fail';
            totalUploadRow.querySelector(`.state > .${completeIconClass}`).hidden = false;
        }

        function updateTracklistsMapData() { // Temporary code
            // Tracklist changes
            if (shouldDeleteTracklist) {
                tracklistsMapData.delete(tracklistId);
                console.log(tracklistsMapData);
                return;
            }

            tracklistData.dateUpdated = new Date().toISOString();
            let tracklistTitle = tracklistData.tracklistTitle = correctText(tracklistTitleInput.value);

            let tracklistCover = fileByFileInput.get(tracklistCoverInput);
            if (tracklistCover) {
                let fileExtension = getExtension(tracklistCover instanceof File ? tracklistCover.name : tracklistCover);
                let filename = 'cover.' + fileExtension;
                tracklistData.cover = `music/${sanitizePathSegment(tracklistTitle)}/${filename}`;
            } else {
                delete tracklistData.cover;
            }
    
            if (action === 'create') tracklistData.tracks = [];

            // Tracks changes
            trackFormItems.forEach(trackFormItem => {
                let trackStatus = trackFormItem.dataset.status;
                let trackId = trackFormItem.dataset.id || crypto.randomUUID();
                let trackOrder = trackFormItem.dataset.order;
                
                if (trackStatus === 'removed') {
                    let trackDataIdx = tracklistData.tracks.findIndex(trackData => trackData.id === trackId);
                    tracklistData.tracks.splice(trackDataIdx, 1);
                } else if (trackStatus === 'existing') {
                    let trackData = tracklistData.tracks.find(trackData => trackData.id === trackId);
                    let isTrackDataChanged = false;
                    let isTracklistTitleChanged = tracklistTitleInput.hasAttribute('data-value-changed');

                    if (trackOrder !== trackFormItem.dataset.originalOrder) {
                        trackData.order = Number(trackOrder);
                        isTrackDataChanged = true;
                    }

                    trackFormItem.querySelectorAll('input[type="text"]').forEach(input => {
                        if (input.hasAttribute('data-value-changed')) {
                            changeTextData(trackData, input);
                            isTrackDataChanged = true;
                        }
                    });

                    const fileInput = trackFormItem.querySelector('input[type="file"]');
                    let isFileChanged = fileInput.hasAttribute('data-value-changed');
                    if (isFileChanged || isTrackDataChanged || isTracklistTitleChanged) changeFileData(trackData, fileInput);
                } else if (trackStatus === 'new') {
                    let trackData = {
                        id: trackId,
                        order: Number(trackOrder)
                    };

                    trackFormItem.querySelectorAll('input[type="text"]').forEach(input => changeTextData(trackData, input));

                    const fileInput = trackFormItem.querySelector('input[type="file"]');
                    changeFileData(trackData, fileInput);

                    tracklistData.tracks.push(trackData);
                }
            });

            tracklistData.tracks
                .sort((a, b) => a.order - b.order)
                .forEach((trackData, idx) => trackData.order = idx + 1);

            console.log(tracklistsMapData.get(tracklistId));

            function changeTextData(trackData, input) {
                let textValue = correctText(input.value);
                trackData[input.name] = textValue;
            }

            function changeFileData(trackData, input) {
                let file = fileByFileInput.get(input);
                let fileExtension = getExtension(file instanceof File ? file.name : file);
                let filename = `${trackData.order}. ${trackData.artist} - ${trackData.title}.${fileExtension}`
                trackData.src = `music/${sanitizePathSegment(tracklistTitle)}/${sanitizePathSegment(filename)}`;
            }

            function getExtension(filename) {
                return filename.split('.').pop();
            }
        }

        function updatePlaylistTracks() {
            let delNum = 0;
            let isUpdated = false;

            [].forEach.call(playlist.children, (playlistTrack, idx) => {
                const audio = playlistTrack.querySelector('audio');
                let trackId = audio.dataset.id;
                let trackState = trackStates.successful.get(trackId) || 'unchanged';
    
                if (trackState === 'deleted') {
                    if (playlistTrack.classList.contains('pending-removal')) return;
                    if (playlistTrack.classList.contains('removing')) return;
    
                    delNum++;
                    playlistTrack.classList.add('pending-removal');
                    setAnimationDelay('remove-track-from-playlist', delNum, () => removeTrackFromPlaylist(playlistTrack));

                    if (audio === selectedAudio) finishPlaying();
                } else if (trackState === 'updated') {
                    isUpdated = true;

                    const artistName = playlistTrack.querySelector('.artist-name');
                    const trackTitle = playlistTrack.querySelector('.track-title');
                    let trackData = tracklistData.tracks.find(trackData => trackData.id === trackId);
                    let dub = audio.dataset.dub;

                    playlistTracksData[idx].artist = audio.dataset.artist = artistName.textContent = trackData.artist;
                    playlistTracksData[idx].title = audio.dataset.title = trackTitle.textContent = trackData.title;
                    playlistTracksData[idx].src = audio.dataset.src = trackData.src;
                    if (dub) trackTitle.textContent += ' (' + dub + ')';

                    if (cachedAudioPool.has(audio)) clearAudioCache(audio);

                    if (audio === selectedAudio) {
                        showTrackInfo(audio, audio);
                        if (playOn) playAudio(audio);
                    }
                }
            });

            if (isUpdated) {
                updateCurrentPlaylist();
                localStorage.setItem('playlist_tracks_data', encodeURIComponent(JSON.stringify(playlistTracksData)));
            }
        }

        async function updateTracklistDatabase() {
            tracklistDtbsBtn.classList.remove('enabled');
            tracklistDtbsBtn.classList.add('waiting');

            let isExpanded = tracklistSection?.ariaExpanded === 'true';
            let sortedTracklists, newTracklistIdx, shouldChangeTrlPosition, activeTracklistTrackId;

            try {
                if (shouldDeleteTracklist) {
                    if (isExpanded) await toggleTracklistTracksSize('shrink');
                    await toggleTracklistSectionVisibility('hide');
                    await toggleTracklistSectionSize('shrink');
                    deleteTracklistSection();
                    finalizeTracklistDatabaseUpdating();
                    return;
                }

                sortedTracklists = Array.from(tracklistsMapData.entries()).sort(sortFunctions[trlsSortOrder]);
                newTracklistIdx = sortedTracklists.findIndex(([trlId, ]) => trlId === tracklistId);
                
                if (action === 'edit') {
                    shouldChangeTrlPosition = hasTracklistDataChanged ? predictTracklistSectionShift() : false;

                    if (shouldChangeTrlPosition) {
                        if (isExpanded) await toggleTracklistTracksSize('shrink');
                        await toggleTracklistSectionVisibility('hide');
                        await toggleTracklistSectionSize('shrink');
                        if (isExpanded) saveActiveElementInfo();
                        applyChangesToTracklist();
                        applyChangesToTracks();
                        insertTracklistSection();
                        await scrollToTracklistSection();
                        if (isExpanded) applyActiveElementInfo();
                        await toggleTracklistSectionSize('grow');
                        await toggleTracklistSectionVisibility('show');
                        if (!isExpanded) await expandTracklistDetails();
                        await toggleTracklistTracksSize('grow');
                        finalizeTracklistDatabaseUpdating();
                    } else {
                        if (hasTracklistDataChanged) {
                            if (isExpanded) await toggleTracklistTracksSize('shrink');
                            await toggleTracklistSectionVisibility('hide');
                            if (isExpanded) saveActiveElementInfo();
                            applyChangesToTracklist();
                            applyChangesToTracks();
                            setNoSizeToTracklistTracks();
                            if (isExpanded) applyActiveElementInfo();
                            await toggleTracklistSectionVisibility('show');
                            if (!isExpanded) await expandTracklistDetails();
                            await toggleTracklistTracksSize('grow');
                            finalizeTracklistDatabaseUpdating();
                        } else {
                            if (isExpanded) await toggleTracklistTracksSize('shrink');
                            if (isExpanded) saveActiveElementInfo();
                            applyChangesToTracks();
                            setNoSizeToTracklistTracks();
                            if (isExpanded) applyActiveElementInfo();
                            if (!isExpanded) await expandTracklistDetails();
                            await toggleTracklistTracksSize('grow');
                            finalizeTracklistDatabaseUpdating();
                        }
                    }
                    return;
                }
                
                if (action === 'create') {
                    tracklistSection = createTracklistSection(tracklistId, tracklistData, true);
                    tracklistDetails = tracklistSection.querySelector('.tracklist-details');
                    list = tracklistDetails.querySelector('.list');

                    insertTracklistSection();
                    calcTracklistsTextIndent(list);
                    await scrollToTracklistSection();
                    await toggleTracklistSectionSize('grow');
                    await toggleTracklistSectionVisibility('show');
                    await expandTracklistDetails();
                    await toggleTracklistTracksSize('grow');
                    finalizeTracklistDatabaseUpdating();
                    return;
                }
            } catch(error) {
                console.error('The error has occurred:', error);
                finalizeTracklistDatabaseUpdating();
            }

            function predictTracklistSectionShift() {
                if (shouldDeleteTracklist || !tracklistTitleInput.hasAttribute('data-value-changed')) {
                    return false;
                } else {
                    let oldTracklistIdx = Array.from(tracklistsContainer.children).indexOf(tracklistSection);
                    if (newTracklistIdx === oldTracklistIdx) return false;
                }
                return true;
            }

            function toggleTracklistTracksSize(className) {
                return new Promise(resolve => {
                    const allTracklistTracks = Array.from(list.children);
                    let tracklistTrackNum = allTracklistTracks.length;
                    if (!tracklistTrackNum) resolve();

                    if (className === 'shrink') allTracklistTracks.reverse();

                    allTracklistTracks.forEach((tracklistTrack, idx) => {
                        setAnimationDelay(`${className}-track-in-tracklist`, idx * 2, () => 
                            animateAction(tracklistTrack));
                    });

                    if (className === 'grow') {
                        requestAnimationFrame(function callback() {
                            scrollToViewAnimatedElement(tracklistsContainer, tracklistSection, commonSpacing);
                            if (tracklistTrackNum) requestAnimationFrame(callback);
                        });
                    }
    
                    function animateAction(tracklistTrack) {
                        tracklistTrack.classList.remove('no-size');
                        tracklistTrack.style.height = tracklistTrack.offsetHeight + 'px';
                        tracklistTrack.classList.add(className);
        
                        eventManager.addOnceEventListener(tracklistTrack, 'animationend', () => {
                            tracklistTrackNum--;
        
                            if (className === 'grow') tracklistTrack.classList.remove(className);
                            tracklistTrack.style.height = '';
            
                            if (!tracklistTrackNum) resolve();
                        });
                    }
                });
            }

            function toggleTracklistSectionVisibility(animationAction) {
                tracklistSection.classList.toggle('show', animationAction === 'show');

                return new Promise(resolve => {
                    const transitionProperties = ['left', 'opacity'];
                    let endedTransitionsCount = 0;

                    tracklistSection.addEventListener('transitionend', function handleTransitionEnd(event) {
                        if (!transitionProperties.includes(event.propertyName)) return;

                        endedTransitionsCount++;
    
                        if (endedTransitionsCount === transitionProperties.length) {
                            tracklistSection.removeEventListener('transitionend', handleTransitionEnd);
                            resolve();
                        }
                    });
                });
            }

            function toggleTracklistSectionSize(className) {
                tracklistSection.style.height = tracklistSection.offsetHeight + 'px';
                tracklistSection.classList.add(className);
    
                requestAnimationFrame(function callback() {
                    if (tracklistSection && !tracklistSection.classList.contains('no-size')) {
                        scrollToViewAnimatedElement(tracklistsContainer, tracklistSection, commonSpacing);
                    }
                    if (tracklistSection.classList.contains(className)) requestAnimationFrame(callback);
                });

                return new Promise(resolve => {
                    eventManager.addOnceEventListener(tracklistSection, 'animationend', () => {
                        tracklistSection.classList.remove(className);
                        tracklistSection.style.height = '';
                        resolve();
                    });
                });
            }
    
            function expandTracklistDetails() {
                return new Promise(resolve => {
                    toggleTracklistDetails(tracklistSection, { targetState: 'expand', applyToAll: false });
                    eventManager.addOnceEventListener(tracklistDetails, 'transitionend', resolve);
                });
            }
        
            function insertTracklistSection() {
                let prevTracklistId = newTracklistIdx ? sortedTracklists[newTracklistIdx - 1][0] : null;
                let prevTracklistSection = prevTracklistId ?
                    Array.from(tracklistsContainer.children).find(trl => trl.dataset.id === prevTracklistId) :
                    null
                ;

                if (prevTracklistSection) {
                    prevTracklistSection.after(tracklistSection);
                } else {
                    tracklistsContainer.prepend(tracklistSection);
                }
            }

            function scrollToTracklistSection() {
                if (!isExpanded) tracklistDetails.classList.add('instant-auto-height');

                let trlSectionHeight = tracklistSection.offsetHeight;
                let trlSectionMrgnTop = parseInt(getComputedStyle(tracklistSection).marginTop);
                
                setNoSizeToTracklistTracks();
                tracklistDetails.classList.remove('instant-auto-height');
                tracklistSection.classList.add('no-size'); // Needed for the correct value of offsetTop (top = bottom)

                let trlSectionTop = tracklistSection.offsetTop + trlSectionMrgnTop;
                let trlsContHeight = tracklistsContainer.offsetHeight;
                let trlsContScrolled = tracklistsContainer.scrollTop;
                let trlsContMaxScrolled = tracklistsContainer.scrollHeight - trlsContHeight;
                let shiftCenter = Math.round(trlsContHeight / 2 - trlSectionHeight / 2);
                if (shiftCenter < 0) shiftCenter = 0;
                let y = trlSectionTop - shiftCenter;
    
                if (
                    (trlsContScrolled || trlSectionTop > shiftCenter) &&
                    (trlsContScrolled < trlsContMaxScrolled || trlSectionTop < trlsContScrolled + shiftCenter)
                ) {
                    tracklistsContainer.scrollTo({
                        top: y,
                        behavior: 'smooth'
                    });
        
                    return new Promise(resolve => {
                        eventManager.addOnceEventListener(tracklistsContainer, 'scrollend', () => {
                            tracklistSection.classList.remove('no-size');
                            resolve();
                        });
                    });
                } else {
                    tracklistSection.classList.remove('no-size');
                    return Promise.resolve();
                }
            }

            function deleteTracklistSection() {
                tracklistSection.classList.add('no-size');

                if (
                    tracklistSection.contains(document.activeElement) ||
                    (shouldFocusTracklistSection && document.activeElement === document.body)
                ) {
                    const newActiveElem = tracklistSection.nextElementSibling ||
                        tracklistSection.previousElementSibling ||
                        createTracklistBtn
                    ;
                    decideFocusAction(newActiveElem);
                    shouldFocusTracklistSection = false;
                }
                
                tracklistSection.remove();
            }
    
            function applyChangesToTracklist() {
                const coverImg = tracklistDetails.querySelector('.cover-box > img');
                let tracklistTitle = restoreText(tracklistData.tracklistTitle);
    
                if (tracklistTitleInput.hasAttribute('data-value-changed')) {
                    tracklistSection.querySelector('.tracklist-title').innerHTML = tracklistTitle;
                    coverImg.alt = `${clearTextFromHtml(tracklistTitle)} Cover`;
                } 
    
                if (tracklistCoverInput.hasAttribute('data-value-changed')) {
                    let coverSrc = tracklistData.cover;
                    coverImg.src = coverSrc || DEFAULTS_DATA['cover-source'];
                }
            }
    
            function applyChangesToTracks() {
                list.innerHTML = '';

                const checkboxAll = tracklistDetails.querySelector('header.strip input[type="checkbox"]');
                checkboxAll.checked = true;
                checkboxAll.classList.remove('partial-list');
        
                createTracklistTracks(list, tracklistData);
                toggleTracklistActivitiesFocusability(tracklistDetails);
                calcTracklistsTextIndent(list);
            }

            function setNoSizeToTracklistTracks() {
                [].forEach.call(list.children, tracklistTrack => tracklistTrack.classList.add('no-size'));
            }

            function saveActiveElementInfo() {
                let activeElem = savedActiveElem || document.activeElement;

                if (list.contains(activeElem)) {
                    const li = activeElem.closest('li');
                    let trackId = li.dataset.id;

                    if (trackStates.successful.get(trackId) !== 'deleted') {
                        activeTracklistTrackId = trackId;
                        shouldFocusTracklistSection = false;
                    }
                } else {
                    if (tracklistSection.contains(activeElem)) {
                        if (!savedActiveElem) savedActiveElem = activeElem;
                        shouldFocusTracklistSection = false;
                    }
                }
            }

            function applyActiveElementInfo() {
                if (activeTracklistTrackId) {
                    const activeTracklistTrack = [].find.call(list.children, tracklistTrack =>
                        tracklistTrack.dataset.id === activeTracklistTrackId);

                    if (activeTracklistTrack) {
                        const checkboxLabel = activeTracklistTrack.querySelector('label.design-proxy');
                        decideFocusAction(checkboxLabel);
                    }
                } else if (savedActiveElem && keysInfoWin.hidden) {
                    savedActiveElem.focus();
                    savedActiveElem = null;
                }
            }
        }

        function finalizeTracklistDatabaseUpdating() {
            console.log('+ complete updating tracklist database');

            tracklistDatabase.classList.remove('updating');
            tracklistDtbsBtn.classList.remove('waiting');
            tracklistDtbsBtn.classList.add('enabled');

            if (shouldFocusTracklistSection) decideFocusAction(tracklistSection);
            calcTracklistsContainerMaxHeight();
            setDocScrollbarYWidth();
            checkTracklistDtbsAction();
        }
    
        function reportErrorAndReloadPage() {
            alert('The current database does not reflect the actual data. The page will be reloaded.');
            window.location.href += '?nocache=' + Math.random(); // Reloading the page bypassing the cache
        }
    }
}

async function checkChangesBeforeHideTracklistManager() {
    
    const trackForms = tracklistMgrWin.querySelector('.track-forms');
    const allInputs = Array.from(tracklistMgrWin.querySelectorAll('.scrollable-area input'));
    let isFormChanged = checkFormChanges(trackForms, allInputs);

    if (isFormChanged) {
        if (confirm('Changes have been detected in the tracklist manager form. \
Do you wish to close the dialog window? Any entered data will be lost.')) {
            hideTracklistManager();
        }
    } else {
        hideTracklistManager();
    }
}

function hideTracklistManager() {
    const tracklistForm = tracklistMgrWin.querySelector('.tracklist-form');
    const trackForms = tracklistMgrWin.querySelector('.track-forms');
    const dropZone = tracklistMgrWin.querySelector('.drop-zone');
    const tracklistRemovalConfirm = tracklistMgrWin.querySelector('.tracklist-removal-confirm');
    const tracklistRemovalCheckbox = tracklistRemovalConfirm.querySelector('input[type="checkbox"]');
    const totalUploadRow = tracklistMgrWin.querySelector('.total-upload-row');

    tracklistMgrWin.oninput = tracklistMgrWin.onkeydown = tracklistMgrWin.onclick = null;
    dropZone.ondragenter = dropZone.ondragleave = dropZone.ondragover = dropZone.ondrop = null;
    tracklistRemovalCheckbox.onchange = null;

    tracklistMgrWin.classList.remove('active');

    eventManager.addOnceEventListener(tracklistMgrWin, 'transitionend', () => {
        if (tracklistMgrWin.classList.contains('active')) return;

        deactivateModalWindow(tracklistMgrWin);

        cancelAllAnimationDelays('create-track-fieldset');
        trackForms.querySelectorAll('[id^="track-form-item"], .content-box').forEach(elem => {
            eventManager.clearEventHandlers(elem);
        });
        eventManager.clearEventHandlers(window, 'blur', 'focus');
        fileByFileInput.clear();

        tracklistMgrWin.firstElementChild.classList.remove('warning');
        tracklistMgrWin.querySelector('.scrollable-area').removeAttribute('data-inactive');
        tracklistMgrWin.querySelector('#tracklist-manager-title').innerHTML = '';
        tracklistMgrWin.querySelector('#tracklist-manager-description').innerHTML = '';
        tracklistForm.className = 'tracklist-form';
        tracklistForm.innerHTML = '';
        trackForms.innerHTML = '';
        trackForms.style.removeProperty('--track-form-items-height-difference');
        dropZone.hidden = false;dropZone.classList.remove('inactive');
        dropZone.firstElementChild.classList.remove('inactive');
        tracklistRemovalConfirm.hidden = false;
        tracklistRemovalCheckbox.checked = false;
        tracklistRemovalCheckbox.disabled = false;
        totalUploadRow.hidden = true;
        totalUploadRow.querySelector('.upload-progress').style.width = '';
        totalUploadRow.querySelector('.display-progress').textContent = '0%';
        totalUploadRow.querySelector('.state > .ok').hidden = true;
        totalUploadRow.querySelector('.state > .fail').hidden = true;
        tracklistMgrWin.querySelector('.ok-button').disabled = true;
        tracklistMgrWin.querySelector('.cancel-button').disabled = false;
        tracklistMgrWin.querySelector('.close-button').disabled = false;
    });
}

function checkFormChanges(trackFormList, inputs) {
    let isFormChanged = false;

    isFormChanged = [].some.call(trackFormList.children, trackFormItem => 
        trackFormItem.dataset.status !== 'existing' || trackFormItem.dataset.originalOrder !== trackFormItem.dataset.order
    );

    if (!isFormChanged) {
        isFormChanged = inputs.some(input => {
            switch (input.type) {
                case 'text':
                    return correctText(input.value) !== correctText(input.dataset.originalValue || '');
                case 'file':
                    return fileByFileInput.get(input) !== (input.dataset.existingFile || null);
                default:
                    console.log('Unknown input type: ' + input.type);
                    return false;
            }
        });
    }

    return isFormChanged;
}

function decideFocusAction(elem) {
    if (keysInfoWin.hidden) {
        elem.focus();
    } else {
        savedActiveElem = elem;
    }
}

function toggleTracklistActivitiesFocusability(tracklistDetails) {
    const focusableElems = tracklistDetails.querySelectorAll('label.design-proxy');
    focusableElems.forEach(elem => elem.tabIndex = (tracklistDetails.style.height !== '0px') ? 0 : -1);
}

function scrollToViewAnimatedElement(container, element, outlineHeight = 0) {
    let contTop = container.scrollTop;
    let contBottom = contTop + container.offsetHeight;
    let elemTop = element.offsetTop - outlineHeight;
    let elemBottom = element.offsetTop + element.offsetHeight + outlineHeight;

    if (elemBottom > contBottom) {
        container.scrollTop += (elemBottom - contBottom);
    } else if (elemBottom < contBottom && elemTop < contTop) {
        container.scrollTop = elemTop;
    }
}

function checkTracklistDtbsAction() {
    if (!tracklistDatabase.hasAttribute('data-waiting-action')) return;

    tracklistDatabase.removeAttribute('data-waiting-action');
    tracklistDatabaseAction();
}

function checkTracklistDtbsSorting() {
    if (!tracklistDatabase.hasAttribute('data-waiting-sorting')) return;

    tracklistDatabase.removeAttribute('data-waiting-sorting');
    
    let trlsSortOrderIdx = trlsSortOrderBank.indexOf(trlsSortOrder);
    sortAndCreateTracklists(trlsSortOrderIdx + 1);
}

function checkTracklistDatabasePositionX() {
    let maxWinWidthForTracklistsDtbs = maxTracklistDtbsWidth * 2 + audioPlayer.offsetWidth;

    if (window.innerWidth <= maxWinWidthForTracklistsDtbs) {
        tracklistDatabase.classList.add('sticked-left');
    } else {
        tracklistDatabase.classList.remove('sticked-left');
    }
}

function calcTracklistsContainerMaxHeight() {
    if (!tracklistDatabase.classList.contains('enabled')) return;

    audioPlayerContainer.style.minHeight = '';

    let winHeight = getWinHeight();
    let tracklistDtbsTop = Math.max(tracklistDatabase.getBoundingClientRect().top, 0);
    let restTracklistDtbsHeight = tracklistDatabase.offsetHeight - tracklistsContainer.offsetHeight;
    let maxTracklistsContainerHeight = winHeight - tracklistDtbsTop - restTracklistDtbsHeight -
        (audioPlayerContainerPaddingBottom - siteFooterHeight);

    let audioPlayerContainerBottom = audioPlayerContainer.getBoundingClientRect().bottom;
    let tracklistDtbsBottomHeight = audioPlayerContainerBottom - winHeight - siteFooterHeight;

    if (audioPlayerContainer.offsetHeight > winHeight && tracklistDtbsBottomHeight < 0) {
        maxTracklistsContainerHeight += tracklistDtbsBottomHeight;
    }

    tracklistsContainer.style.maxHeight = maxTracklistsContainerHeight + 'px';
    audioPlayerContainer.style.minHeight = '';

    setTracklistsContainerScrollability();
}

function setTracklistsContainerScrollability() {
    let isScrollable = tracklistsContainer.scrollHeight > tracklistsContainer.offsetHeight;
    let trlsContScrollbarWidth = isScrollable ? `${scrollbarWidth}px` : '';

    tracklistsContainer.classList.toggle('scrollable', isScrollable);
    tracklistsContainer.style.setProperty('--tracklists-container-scrollbar-y-width', trlsContScrollbarWidth);
}

/////////////////////////////////
// Tracklist database creation //
/////////////////////////////////

const trlsSortOrderBank = ['dateUpdated', 'alphabetical'];
const sortFunctions = {
    dateUpdated: ([, a], [, b]) => new Date(b.dateUpdated) - new Date(a.dateUpdated),
    alphabetical: ([, a], [, b]) => a.tracklistTitle.localeCompare(b.tracklistTitle)
};
let trlsSortOrder = localStorage.getItem('tracklists_sort_order');
let tracklistsNum = 0;

function createTracklistDatabase() {
    let trlsSortOrderIdx = trlsSortOrderBank.indexOf(trlsSortOrder);
    sortAndCreateTracklists(trlsSortOrderIdx);

    checkTracklistDatabasePositionX();

    // First audio player load, gaining access to first tracklist after creating tracklist database
    if (!playlistTracksData) playlistTracksData = tracklistsContainer.children.length ?
        getSelectedTracksData(tracklistsContainer.firstElementChild.querySelector('.list')) :
        [];
}

function sortAndCreateTracklists(idx) {
    if (tracklistsContainer.hasAttribute('data-toggling-details')) {
        tracklistDatabase.setAttribute('data-waiting-sorting', '');
        return;
    }

    trlsSortOrder = trlsSortOrderBank[idx] || trlsSortOrderBank[0];
    localStorage.setItem('tracklists_sort_order', trlsSortOrder);

    const sortIcon = sortTracklistsBtn.firstElementChild;

    switch (trlsSortOrder) {
        case 'dateUpdated':
            sortIcon.src = 'img/icons/sort_date.png';
            sortIcon.alt = 'Sort Date';
            break;
        case 'alphabetical':
            sortIcon.src = 'img/icons/sort_alphabetical.png';
            sortIcon.alt = 'Sort Alphabetical';
            break;
    }

    console.log('tracklist sort order = ' + trlsSortOrder);

    if (!tracklistDatabase.hasAttribute('data-ready')) {
        createSortedTracklists();
    } else {
        tracklistDtbsBtn.classList.remove('enabled');
        tracklistDtbsBtn.classList.add('waiting');
    
        requestAnimationFrame(() => setTimeout(() => {
            for (let trlSection of tracklistsContainer.children) {
                tracklistsExpandedState.set(trlSection.dataset.id, trlSection.ariaExpanded);
            }

            tracklistsContainer.innerHTML = '';
            tracklistsNum = 0;

            createSortedTracklists();

            tracklistsExpandedState.clear();

            // For reseting calcTracklistsTextIndent
            tracklistsContainer.removeAttribute('data-text-indent-for-add-options');

            calcTracklistsTextIndent();
            calcTracklistsContainerMaxHeight();
            setDocScrollbarYWidth();
    
            tracklistDtbsBtn.classList.remove('waiting');
            tracklistDtbsBtn.classList.add('enabled');
        }));
    }

    function createSortedTracklists() {
        Array.from(tracklistsMapData.entries())
            .sort(sortFunctions[trlsSortOrder])
            .forEach(([key, value]) => {
                let tracklistSection = createTracklistSection(key, value);
                tracklistsContainer.appendChild(tracklistSection);
            });
    }
}

function createTracklistSection(tracklistId, tracklistData, isNewTracklist = false) {
    tracklistsNum++;

    const trlSectionFragment = document.createDocumentFragment();
    let isExpanded = tracklistsExpandedState.get(tracklistId) === 'true';
    let tracklistTitle = restoreText(tracklistData.tracklistTitle);
    
    let tracklistSection = document.createElement('section');
    tracklistSection.className = 'tracklist-section';
    if (tracklistDatabase.hasAttribute('data-ready') && !isNewTracklist) tracklistSection.classList.add('show');
    tracklistSection.setAttribute('data-id', tracklistId);
    tracklistSection.setAttribute('data-number', `${tracklistsNum}`);
    tracklistSection.setAttribute('aria-labelledby', `tracklist[${tracklistsNum}]-title`);
    tracklistSection.setAttribute('aria-expanded', isExpanded);
    tracklistSection.setAttribute('aria-controls', `trlDetails[${tracklistsNum}]`);
    tracklistSection.tabIndex = 0;
    trlSectionFragment.appendChild(tracklistSection);

    let menu = document.createElement('div');
    menu.className = 'tracklist-menu';
    menu.innerHTML = `
        <div class="buttons-box left">
            <i class="icon-close delete-tracklist-tracks" data-tooltip="Delete tracklist tracks"></i>
        </div>
        <div class="tracklist-title-box">
            <h4><span id="tracklist[${tracklistsNum}]-title" class="tracklist-title"
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
    details.style.height = isExpanded ? 'auto' : 0;
    details.setAttribute('id', `trlDetails[${tracklistsNum}]`);
    tracklistSection.appendChild(details);

    let header = document.createElement('header');
    header.className = 'strip';
    header.innerHTML = `
        <p>
            <input id="checkbox-tracklist[${tracklistsNum}]-all" type="checkbox" checked
            ><label for="checkbox-tracklist[${tracklistsNum}]-all" class="design-proxy"></label
            ><label for="checkbox-tracklist[${tracklistsNum}]-all"><span>Toggle all tracks</span></label>
        </p>
    `;
    details.appendChild(header);

    let detailsMain = document.createElement('main');
    detailsMain.className = 'details-main';
    details.appendChild(detailsMain);

    let coverBox = document.createElement('div');
    coverBox.className = 'cover-box';
    detailsMain.appendChild(coverBox);

    let coverImg = document.createElement('img');
    coverImg.src = tracklistData.cover || DEFAULTS_DATA['cover-source'];
    coverImg.alt = `${clearTextFromHtml(tracklistTitle)} Cover`;
    coverBox.appendChild(coverImg);

    let list = document.createElement('ul');
    list.className = 'list';
    list.setAttribute('data-number', `${tracklistsNum}`);
    detailsMain.appendChild(list);

    createTracklistTracks(list, tracklistData);

    let footer = document.createElement('footer');
    footer.className = 'strip';
    footer.innerHTML = `
        <p>
            <button id="edit-tracklist[${tracklistsNum}]"></button>
            <label for="edit-tracklist[${tracklistsNum}]" class="design-proxy">
                <svg class="edit-tracklist-svg" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    width="120.000000pt" height="81.000000pt" viewBox="0 0 120.000000 81.000000"
                    preserveAspectRatio="xMidYMid meet">

                    <g transform="translate(0.000000,81.000000) scale(0.100000,-0.100000)"
                        fill="currentColor" stroke="none">
                        <path d="M20 790 c-27 -27 -25 -62 3 -88 23 -22 28 -22 361 -22 l337 0 24 25
                            c30 29 31 45 4 79 l-20 26 -345 0 c-331 0 -345 -1 -364 -20z"/>
                        <path d="M16 528 c-21 -30 -20 -61 2 -81 17 -15 57 -17 370 -17 l352 0 15 24
                            c19 29 11 72 -15 86 -11 6 -159 10 -364 10 l-345 0 -15 -22z"/>
                        <path d="M1055 510 l-29 -30 54 -56 55 -55 34 37 33 36 -48 49 c-27 27 -53 49
                            -59 49 -6 0 -24 -14 -40 -30z"/>
                        <path d="M827 282 l-157 -157 0 -58 0 -57 53 0 52 0 165 165 165 165 -50 50
                            c-27 27 -54 50 -60 50 -6 0 -81 -71 -168 -158z"/>
                        <path d="M17 272 c-21 -23 -22 -51 -1 -80 15 -22 19 -22 238 -22 203 0 224 2
                            239 18 22 24 21 65 -1 85 -16 15 -48 17 -239 17 -200 0 -221 -2 -236 -18z"/>
                    </g>
                </svg>
            </label
            ><label for="edit-tracklist[${tracklistsNum}]">Manage tracklist</label>
        </p>
    `;
    details.appendChild(footer);

    return trlSectionFragment.firstElementChild;
}

function createTracklistTracks(list, tracklistData) {
    if (!Array.isArray(tracklistData.tracks) || !tracklistData.tracks.length) return;

    let currentNum = list.dataset.number;
    let firstTrackArtist = tracklistData.tracks[0]?.artist;
    let hidenity = tracklistData.tracks.some(track => track.artist !== firstTrackArtist) ? '' : ' hidden';

    tracklistData.tracks.forEach(trackData => {
        let li = document.createElement('li');
        Object.entries(trackData).forEach(([key, value]) => li.setAttribute(`data-${key}`, value));
        li.innerHTML = `
            <input id="checkbox-tracklist[${currentNum}]-track[${trackData.order}]" type="checkbox" checked
            ><label for="checkbox-tracklist[${currentNum}]-track[${trackData.order}]" class="design-proxy"></label
            ><label for="checkbox-tracklist[${currentNum}]-track[${trackData.order}]"
                ><div class="order"><span>${trackData.order}.</span></div
                ><span class="track-artist"${hidenity}>${restoreText(trackData.artist)}</span
                ><span class="hyphen"${hidenity}> &ndash; </span
                ><span class="track-title">${restoreText(trackData.title)}</span>
            </label> 
        `;
        list.appendChild(li);
    });
}

///////////////////////
// Playlist creation //
///////////////////////

let playlistTracksData = JSON.parse(decodeURIComponent(localStorage.getItem('playlist_tracks_data')));

function createPlaylist(addedTracksData, clearPlaylist) {
    if (!Array.isArray(addedTracksData)) addedTracksData = [];

    let isTracksRemoving = false;
    let scrollBeforeRemove = false;

    if (audioPlayerContainer.hasAttribute('data-initial')) {
        audioPlayerContainer.removeAttribute('data-initial');
    } else {
        markDuplicates();

        // The current tracklist will be updated and saved after the removal of each track
        if (clearPlaylist && playlist.children.length) {
            playlist.removeAttribute('adding-tracks');
            isTracksRemoving = true;

            if (scrollablePlaylist && playlistLim.scrollTop && !activeScrollKeys.size) {
                scrollBeforeRemove = true;
            } else {
                runRemoveTracks();
            }
        } else { // Saving the current tracklist if the playlist tracks are not removing
            localStorage.setItem('playlist_tracks_data', encodeURIComponent(JSON.stringify(playlistTracksData)));
        }
    }

    if (scrollBeforeRemove) {
        scrollPlaylistToTop();

        eventManager.addOnceEventListener(document, 'endScrollingPlaylist', () => {
            setTimeout(() => {
                runRemoveTracks();
                createPlaylistTracks();
            }, 120);
        });
    } else {
        createPlaylistTracks();
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

    function markDuplicates() {
        if (!addedTracksData.length) return;

        for (let trackData of playlistTracksData) {
            delete trackData['dub'];
        }

        playlistTracksData = playlistTracksData.concat(addedTracksData);

        for (let i = 0; i < playlistTracksData.length; i++) {
            let dub = playlistTracksData[i]['dub'];
            if (dub) continue;

            let artist = playlistTracksData[i]['artist'];
            let title = playlistTracksData[i]['title'];
            let k = 1;
    
            for (let j = i + 1; j < playlistTracksData.length; j++) {
                let comparedArtist = playlistTracksData[j]['artist'];
                let comparedTitle = playlistTracksData[j]['title'];
        
                if (comparedArtist === artist && comparedTitle === title) {
                    playlistTracksData[j]['dub'] = ++k;
                }
            }
        }
    }
    
    function createPlaylistTracks() {
        if (!addedTracksData.length) return;

        const addedTracksFragment = document.createDocumentFragment();
        const addedPlaylistTracks = [];

        addedTracksData.forEach(trackData => {
            let trackId = trackData['id'];
            let artist = trackData['artist'];
            let title = trackData['title'];
            let src = trackData['src'];
            let dub = trackData['dub'];
    
            let track = document.createElement('div');
            track.className = 'track not-ready';
            addedTracksFragment.appendChild(track);

            addedPlaylistTracks.push(track);
        
            let audio = document.createElement('audio');
            audio.setAttribute('data-id', trackId);
            audio.setAttribute('data-artist', artist);
            audio.setAttribute('data-title', title);
            //src += '?nocache=' + Math.random(); // Test cache clearing
            audio.setAttribute('data-src', src);
            if (dub) audio.setAttribute('data-dub', dub);
            audio.setAttribute('type', 'audio/mpeg');
            audio.setAttribute('preload', 'none');
            track.appendChild(audio);
    
            origOrderedAudios.push(audio);
    
            let additionals = document.createElement('div');
            additionals.className = 'additionals';
            track.appendChild(additionals);
    
            let removeTrackBtn = document.createElement('i');
            removeTrackBtn.className = 'icon-close remove-track';
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

        playlist.appendChild(addedTracksFragment);
        
        setPlaylistOrder(true);

        if (isTracksRemoving || removingTracksNum) {
            eventManager.addOnceEventListener(document, 'endTracksRemoving', () => runAddTracks(addedPlaylistTracks));
        } else {
            runAddTracks(addedPlaylistTracks);
        }
    }
            
    function runAddTracks(addedPlaylistTracks) {
        addedPlaylistTracks.forEach((track, idx) => {
            setAnimationDelay('add-track-in-playlist', idx, () => {
                if (track.classList.contains('pending-removal')) return;
                if (track.classList.contains('removing')) return;
    
                playlist.setAttribute('adding-tracks', '');
                track.classList.add('adding');
    
                eventManager.addOnceEventListener(track, 'animationend', () => {
                    if (track.classList.contains('removing')) return;
    
                    track.classList.remove('adding');
                    track.classList.remove('not-ready');
    
                    checkPlaylistScrollability();
                    checkScrollElementsVisibility();
    
                    if (pointerModeScrolling) document.dispatchEvent(new Event('pointermove'));
    
                    // Last added track
                    if (idx === addedPlaylistTracks.length - 1) {
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
            setAnimationDelay('remove-track-from-playlist', idx, () => removeTrackFromPlaylist(track));
        });
    }
}

//////////////////////////////////
// Last played track start info //
//////////////////////////////////

function showLastPlayedTrackInfo() {
    startInfoDisplay.setAttribute('data-displayed', '');

    if (selectedAudio) return;

    let cookies = document.cookie
        .split(';')
        .reduce((acc, cookie) => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {});

    let lastPlayedAudio = cookies['last_played_audio'] && decodeURIComponent(cookies['last_played_audio']);
    let lastPlayDate = cookies['date_of_last_play'];
    if (!lastPlayedAudio || !lastPlayDate) return;

    let timeElapsed = new Date() - new Date(lastPlayDate);
    let timeComponents = {
        days: Math.floor(timeElapsed / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeElapsed / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((timeElapsed / (1000 * 60)) % 60),
        seconds: Math.floor((timeElapsed / 1000) % 60)
    };

    let timeElapsedString = Object.entries(timeComponents)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${value} ${key}`)
        .join(' ');
    
    let startInfo = `Last time you listened to the track
        <span class="track">"${lastPlayedAudio}"</span>
        <span class="time">${timeElapsedString}</span> ago.`;

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
    let lastPlayDate = 'date_of_last_play=' + new Date().toUTCString();
    let dateExpires = new Date(Date.now() + 864e6).toUTCString(); // Delete cookies after 10 days
    let path = '/';
    
    document.cookie = `${lastPlayedAudio}; path=${path}; expires=${dateExpires}`;
    document.cookie = `${lastPlayDate}; path=${path}; expires=${dateExpires}`;
}

//////////////////
// Key handlers //
//////////////////

function connectKeyHandlers() {
    // Document keys, no modifiers or repea
    document.addEventListener('keydown', (event) =>  {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
        if (document.activeElement.matches('input[type="text"]')) return;

        //Playing/pausing audio
        if (event.code === 'KeyW' || event.code === 'Space') {
            event.preventDefault();
            highlightButton(playPauseBtn, event.code, playPauseAction);
            return;
        }
        // Stoping audio
        if (event.code === 'KeyS') {
            highlightButton(stopBtn, event.code, stopAction);
            return;
        }

        // Stepping/accelerating audio
        if (
            (event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
            event.code === 'KeyA' || event.code === 'KeyD') 
        ) {
            if (
                (event.code === 'ArrowLeft' || event.code === 'ArrowRight') &&
                (
                    document.activeElement.matches('input[type="text"]') ||
                    document.activeElement.matches('input[type="number"]')
                )
            ) {
                return;
            }

            let btn = accelerationData.keys[event.code].button;
            highlightButton(btn, event.code, downKeyStepAccAction, event.code);
            return;
        }

        // Randomizing playlist
        if (event.code === 'KeyQ') {
            highlightButton(shuffleBtn, event.code, shuffleAction);
            return;
        }
        // Repeating track/playlist
        if (event.code === 'KeyE') {
            highlightButton(repeatBtn, event.code, repeatAction);
            return;
        }

        // Changing buttons configuration
        if (event.code === 'KeyZ') {
            changeAudioControlsConfiguration.eventType = event.type;
            let idx = configsBank.indexOf(config);
            highlightButton(configBtn, event.code, changeAudioControlsConfiguration, idx + 1);
            return;
        }
        // Changing audio player coloring
        if (event.code === 'KeyX') {
            let idx = audioPlayerColorsBank.indexOf(audioPlayerColor);
            highlightButton(colorBtn, event.code, changeAudioPlayerColor, idx + 1);
            return;
        }
        // Changing playlist style
        if (event.code === 'KeyC') {
            let idx = playlistStylesBank.indexOf(playlistStyle);
            highlightButton(playlistStyleBtn, event.code, changePlaylistStyle, idx + 1);
            return;
        }

        // Showing/hiding settings
        if (event.code === 'KeyF') {
            highlightButton(settingsBtn, event.code, settingsAction);
            return;
        }
        // Showing/hiding keys info
        if (event.code === 'KeyI') {
            highlightButton(keysInfoBtn, event.code, keysInfoAction);
            return;
        }

        // Showing/hiding tracklist database
        if (event.code === 'KeyT') {
            highlightButton(tracklistDtbsBtn, event.code, tracklistDatabaseAction);
            return;
        }

        // Showing/hiding tracklist manager
        if (event.code === 'Insert') {
            if (!tracklistDatabase.hasAttribute('data-ready')) return;
            if (tracklistDatabase.classList.contains('updating')) return;
            if (tracklistsContainer.contains(document.activeElement)) return;
            highlightButton(createTracklistBtn, event.code, tracklistManagerAction, null);
            return;
        }

        // Sorting tracklists
        if (event.code === 'KeyV') {
            if (!tracklistDatabase.hasAttribute('data-ready')) return;
            if (tracklistDatabase.classList.contains('updating')) return;
            let trlsSortOrderIdx = trlsSortOrderBank.indexOf(trlsSortOrder);
            highlightButton(sortTracklistsBtn, event.code, sortAndCreateTracklists, trlsSortOrderIdx + 1);
            return;
        }
        // Expanding all tracklist details
        if (event.code === 'NumpadAdd') {
            if (!tracklistDatabase.hasAttribute('data-ready')) return;
            if (tracklistDatabase.classList.contains('updating')) return;
            highlightButton(expandAllTrlDetailsBtn, event.code, expandAllTracklistDetails);
            return;
        }
        // Collapsing all tracklist details
        if (event.code === 'NumpadSubtract') {
            if (!tracklistDatabase.hasAttribute('data-ready')) return;
            if (tracklistDatabase.classList.contains('updating')) return;
            highlightButton(collapseAllTrlDetailsBtn, event.code, collapseAllTracklistDetails);
            return;
        }
        // Clearing playlist
        if (event.code === 'Backspace') {
            if (document.activeElement.matches('input[type="number"]')) return;
            highlightButton(clearPlaylistBtn, event.code, clearPlaylist);
            return;
        }

        // Closing keys info and settings by keypressing 'Escape'
        if (event.code === 'Escape') {
            const areas = [ // Order is important!
                { element: tracklistMgrWin, action: checkChangesBeforeHideTracklistManager },
                { element: tracklistDelWin, action: hideTracklistDeletion },
                { element: keysInfoWin, action: hideKeysInfo },
                { element: settingsArea, action: hideSettings }
            ];
            
            for (let { element, action } of areas) {
                if (element.classList.contains('active')) {
                    if (
                        (element === tracklistMgrWin || element === tracklistDelWin) &&
                        tracklistDatabase.classList.contains('updating')
                    ) {
                        continue;
                    }

                    let closeBtn = element.querySelector('.close-button');
                    highlightButton(closeBtn, event.code, action);
                    break;
                }
            }

            return;
        }

        // Handling the Enter key press for checkboxes and proxy labels
        if (event.key === 'Enter') {
            let target;

            if (target = event.target.closest('input[type="checkbox"]')) {
                if (target.disabled) return;

                target.checked = !target.checked;
                target.dispatchEvent(new Event('change')); 
                return;
            }
            
            if (target = event.target.closest('label.design-proxy')) {
                const elem = document.getElementById(target.getAttribute('for'));
                if (elem.disabled) return;

                if (elem.tagName === 'INPUT' && elem.type === 'checkbox') {
                    elem.checked = !elem.checked;
                    elem.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
                }
                if (elem.tagName === 'BUTTON') {
                    elem.dispatchEvent(new Event('click', { bubbles: true }));
                    return;
                }
            }
        }
    });

    // Сhanging volume
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (document.activeElement.matches('input[type="text"]')) return;

        // On/off volume
        if (event.code === 'KeyM' || event.code === 'KeyR') {
            if (event.repeat) return;
            highlightButton(volumeBtn, event.code, volumeAction);
            return;
        }
        // Increasing volume
        if ((event.shiftKey && event.code === 'ArrowUp') || event.code === 'Period') {
            let keyRepeat = event.repeat ? true : false;
            changeVolumeAction('increase', keyRepeat);
            return;
        }
        // Reducing volume
        if ((event.shiftKey && event.code === 'ArrowDown') || event.code === 'Comma') {
            let keyRepeat = event.repeat ? true : false;
            changeVolumeAction('reduce', keyRepeat);
            return;
        }
    });

    // Scrolling playlist
    document.addEventListener('keydown', (event) =>  {
        if (event.shiftKey && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) return;

        if (
            (event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
            event.code === 'PageUp' || event.code === 'PageDown' ||
            event.code === 'Home' || event.code === 'End') &&
            !event.repeat
        ) {
            downKeyScrollAction(event);
            return;
        }
        if (
            (event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
            event.code === 'PageUp' || event.code === 'PageDown' ||
            event.code === 'Home' || event.code === 'End') &&
            event.repeat
        ) {
            repeatKeyScrollAction(event);
            return;
        }
    });
    document.addEventListener('keyup', (event) =>  {
        if (
            event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
            event.code === 'PageUp' || event.code === 'PageDown' ||
            event.code === 'Home' || event.code === 'End'
        ) {
            upKeyScrollAction(event);
        }
    });

    // Focusing tracks
    visPlaylistArea.addEventListener('keydown', function (event) {
        let trackInfoBox = event.target.closest('.track-info-box');
        if (!trackInfoBox || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;

        // Select track in playlist
        if (event.key === 'Enter') {
            let track = trackInfoBox.closest('.track');
            document.getSelection().empty();
            highlightButton(playPauseBtn, event.code, selectPlaylistTrack, track);
            return;
        }
        // Remove track from playlist
        if (event.key === 'Delete') {
            let track = trackInfoBox.closest('.track');
            let removeTrackBtn = track.querySelector('.remove-track');
            highlightButton(removeTrackBtn, event.code, removeTrackFromPlaylist, track, event.type);
            return;
        }
    });

    // Focusing tracklists
    tracklistsContainer.addEventListener('keydown', (event) => {
        if (!tracklistDatabase.hasAttribute('data-ready')) return;
        if (tracklistDatabase.classList.contains('updating')) return;
        let tracklistSection = event.target.closest('.tracklist-section');
        if (!tracklistSection || event.ctrlKey || event.repeat) return;

        // Expanding tracklist section
        if (event.key === 'Enter' && !event.shiftKey) {
            if (tracklistSection !== document.activeElement) return;
            let tracklistTitle = tracklistSection.querySelector('.tracklist-title');
            highlightButton(tracklistTitle, event.code, toggleTracklistDetails, tracklistSection);
            return;
        }
        // Delete tracks from tracklist
        if (event.code === 'Delete' && !event.shiftKey) {
            let delBtn = tracklistSection.querySelector('.delete-tracklist-tracks');
            highlightButton(delBtn, event.code, showTracklistDeletion, tracklistSection);
            return;
        }
        // Clear playlist and add tracks from tracklist
        if ((event.altKey || event.metaKey) && event.code === 'NumpadAdd') {
            let replaceBtn = tracklistSection.querySelector('i.tracklist-to-playlist-replace');
            highlightButton(replaceBtn, event.code, addTracklistToPlaylist, tracklistSection, true);
            return;
        }
        // Add tracks from tracklist
        if (event.shiftKey && event.code === 'NumpadAdd') {
            let addBtn = tracklistSection.querySelector('i.tracklist-to-playlist-add');
            highlightButton(addBtn, event.code, addTracklistToPlaylist, tracklistSection, false);
            return;
        }
        // Manage existing tracklist
        if (event.code === 'Insert') {
            let manageBtn = tracklistSection.querySelector('label[for^="edit-tracklist"].design-proxy');
            highlightButton(manageBtn, event.code, tracklistManagerAction, tracklistSection);
            return;
        }
    });

    // Enable focus on visPlaylistArea when switching focus back from curPlaylist
    curPlaylist.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        if (event.code === 'Tab' && event.shiftKey) {
            event.preventDefault();
            visPlaylistArea.focus();
        }
    });

    // Temporary check handler
    document.addEventListener('keydown', (event) => {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
        if (event.code === 'KeyG') {
            //console.log(document.activeElement);
            //console.log(highlightActiveElem);
            //console.log(eventManager.eventTypesByElement);
            //console.log(fileByFileInput);
            //console.log(tracklistsMapData);
            console.log(tooltipHoverIntentByElem);
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
    initTooltipHoverIntentConnections();
    initAudioPlayerChanges();
    createTracklistDatabase(tracklistsMapData);

    function initAudioPlayerChanges() {
        changeAudioControlsConfiguration(configsBank.indexOf(config));
        changeNumberOfVisibleTracks(numOfVisTracks);
        changeAudioPlayerColor(audioPlayerColorsBank.indexOf(audioPlayerColor));
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
            audioPlayer.classList.add('show');

            eventManager.addOnceEventListener(audioPlayer, 'animationend', () => {
                document.body.classList.remove('loading');
                audioPlayer.classList.remove('show');
                audioPlayer.classList.add('active');

                createPlaylist(playlistTracksData, true);

                let timeDelay = playlistTracksData.length ? 750 : 0;
                setTimeout(() => {
                    docScrollArrowsContainer.hidden = false;

                    connectKeyHandlers();
                    tracklistDatabaseAction();

                    eventManager.addOnceEventListener(tracklistDatabase, 'endTacklistDtbsAnimation', () => {
                        setTimeout(showLastPlayedTrackInfo, 200);
                    });
                }, timeDelay);
            });
        });
    }, hidePreloadDelay);
}
