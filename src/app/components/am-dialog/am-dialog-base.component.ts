// import { Component, HostBinding, HostListener } from "@angular/core";
// import { DialogRef } from "@angular/cdk/dialog";
// import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';

// @Component({
//     selector: 'am-dialog-base',
//     template: '',
//     animations: [
//         trigger('animation', [
//             state('hidden', style({ transform: 'translateX(120%)' })),
//             state('visible', style({ transform: 'translateX(0)' })),
//             transition('visible <=> hidden', animate('0.3s ease-in-out')),
//         ])
//     ]
// })
// export class AmDialogBase {

//     // @HostBinding('style.display') styleDisplay = 'flex';
//     // @HostBinding('style.flexDirection') styleFlexDirection = 'column';
//     // @HostBinding('style.height') styleHeight = '100vh';
//     // @HostBinding('style.background') styleBackground = '#FFF';
//     // @HostBinding('style.transform') styleTransform = 'translateX(120%)';
//     // @HostBinding('style.transition') styleTransition = 'transform 0.3s ease-in-out';

//     @HostBinding('@animation') animationState = 'visible';

//     @HostListener('@animation.done', ['$event']) doneEvent(event: AnimationEvent) {
//         if (event.toState === 'hidden') {
//             this.dialogRef.close();
//         }
//     }

//     constructor(public dialogRef: DialogRef) {
//         dialogRef.backdropClick.subscribe(() => this.animationState = 'hidden');
//     }

//     closeDialog() {
//         this.animationState = 'hidden';
//     }
// }