import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { Task } from './task/task';
import {MatDialog} from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'kanban-board';
  todo = this.store.collection('todo').valueChanges({idField: 'id'});
  inProgress = this.store.collection('inProgress').valueChanges({idField: 'id'});
  done = this.store.collection('done').valueChanges({idField: 'id'});

  constructor(private dialog: MatDialog, private store: AngularFirestore){}

  drop(event: CdkDragDrop<Task[]>): void {
    if(event.previousContainer === event.container){
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      return Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item)
      ]);
    })
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  edit(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true
      }
    });
    dialogRef
    .afterClosed()
    .subscribe((result: TaskDialogResult) => {
     if(result.delete){
       this.store.collection(list).doc(task.id).delete();
     }else{
       this.store.collection(list).doc(task.id).update(task);
     }
    });

  }

  newTask(): void{
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task:{}
      }
    });
    dialogRef
    .afterClosed()
    .subscribe((result: TaskDialogResult) => this.store.collection('todo').add(result.task));
  }
  
}
