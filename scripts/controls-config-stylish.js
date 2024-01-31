export const configStylish = `
<template id="tmpl-stylish">
    <style>
        .row1 {
            height: 12px;
            text-align: center;
        }
        .row2 {
            margin-bottom: 7px;
        }
        ::slotted(.btn-img-wrapper) {
            position: relative;
            margin: 0 95px !important;
        }
        ::slotted(#rewind),
        ::slotted(#forward) {
            margin: 0 4px !important;
            vertical-align: middle;
        }
        .center-section {
            display: inline-block;
            vertical-align: middle;
        }
        .indicator-wrapper {
            width: 75%;
            margin: 8px auto;
        }
        ::slotted(#indicator) {
            height: 3px;
            border-radius: 5px;
        }
    </style>

    <div class="row1">
        <slot name="shuffle"></slot>
        <slot name="repeat"></slot>
    </div>
    <div class="row2">
        <slot name="rewind"></slot>
        <div class="center-section">
            <slot name="play-pause"></slot>
            <div class="indicator-wrapper">
                <slot name="indicator"></slot>
            </div>
            <slot name="stop"></slot>
        </div>
        <slot name="forward"></slot>
    </div>
    <div class="row3">
        <slot name="volume"></slot>
    </div>
</template>
`;
