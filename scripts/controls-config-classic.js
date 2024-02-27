export const configClassic = `
<template id="tmpl-classic">
    <style>
        .row1 {
            margin-bottom: 16px;
        }
        .row2 {
            display: flex;
            justify-content: center;
            align-items: center;
            line-height: 100%;
            vertical-align: middle;
        }
        ::slotted(.volume-container) {
            margin: 0 25px !important;
        }
    </style>
    <div class="row1">
        <slot name="rewind"></slot>
        <slot name="stop"></slot>
        <slot name="play-pause"></slot>
        <slot name="forward"></slot>
    </div>
    <div class="row2">
        <slot name="shuffle"></slot>
        <slot name="volume"></slot>
        <slot name="repeat"></slot>
    </div>
</template>
`;
