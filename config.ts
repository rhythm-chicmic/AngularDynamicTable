import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CLASS } from 'src/app/common/class.constant';
import { AppConstants, PageTitles } from 'src/app/common/constant';

@Component({
  selector: 'app-shared-details-page',
  templateUrl: './shared-details-page.component.html',
  styleUrls: ['./shared-details-page.component.scss']
})
export class SharedDetailsPageComponent implements OnInit {
  titles = PageTitles.EMPLOYEE_ESIMATES;
  ZERO =0;
  MINUS_ONE=-1;
  header = this.titles.TableHead;
  dateTimeFormat = "dd/MM/yyyy hh:mm a";
  dateFormat = "dd/MM/yyyy";
  estimateId;
  classValue=CLASS;
  emptyValue = AppConstants.EmptyValue;
  submitted=false;
  givenByArray=[];
  teamArray=[];
  taskNameArray=[];
  @Input() displayColor=true;
  @Input() records;
  @Input() canMessage;
  employeeEstimateForm!:FormGroup;

  private editedCellIndices: { row: number, col: number }[] = [];

  constructor(private fb:FormBuilder,private cdr:ChangeDetectorRef) { 
  }

  ngOnInit(): void {
  this.initEstimateForm();
  }

  initEstimateForm(){
    this.employeeEstimateForm = this.fb.group({
      estimateForm: this.fb.array([])
    })
  }
/**
 * it is used to create a Task
 * @returns | Return the FormGroup
 */
  createTask(){
    return this.fb.group({
      taskName:['',Validators.required],
      taskDetails:this.fb.array([])
    })
  }

  /**
   * Function to Add More Tasks in the Table list
   */
  addMoreTasks(){
    this.addTask();
    const taskLength = this.getFormArrayControls('estimateForm');
    const index = taskLength.length -1;
    this.getTaskDetails(index);
  }

  /**
   * 
   * @param formControlName | FormArrayName is passed 
   * @returns the formArray Control used in the HTML 
   */
  getFormArrayControls(formControlName: string) {
    return (this.employeeEstimateForm.get(formControlName) as FormArray)?.controls;
  }

  /**
   * 
   * @param formControlName | FormArrayName is passed
   * @param index | and Index is given to return the Controls having Array of formGroups
   * @returns | formControl
   */
  getNestedFormArrayControls(formControlName:string,index?:any){
    const estimateFormArray= (this.employeeEstimateForm.get('estimateForm') as FormArray);
    const taskArray = (estimateFormArray?.at(index)?.get(formControlName) as FormArray)?.controls;
    return taskArray;
  }

  /**
   * Add Task to the formArray
   */
  addTask(){
    const estimateFormArray = this.employeeEstimateForm.get('estimateForm') as FormArray;
    const newTask = this.createTask();
    estimateFormArray.push(newTask);
  }

  /**
   * adding Task-Details in the TaskList
   * @param taskIndex | taskIndex
   */
  getTaskDetails(taskIndex:number){
    const estimateFormArray = this.employeeEstimateForm.get('estimateForm') as FormArray;
    const taskArray = estimateFormArray.at(taskIndex).get('taskDetails') as FormArray;
    const newTaskDetails = this.addTaskDetails();
    taskArray.push(newTaskDetails);
  }

  /**
   * remove task From the lists of Tasks
   * @param taskIndex | taskIndex
   */
  removeTask(taskIndex:number){
    const estimateFormArray = this.employeeEstimateForm.get('estimateForm') as FormArray;
    estimateFormArray.removeAt(taskIndex);
  }

  /**
   *  remove that TaskDetail for that Task Name
   * @param taskIndex | take TaskIndex
   * @param detailIndex | takes the index of particular taskDetail
   */
  removeTaskDetails(taskIndex:number, detailIndex:number){
    const estimateFormArray = this.employeeEstimateForm.get('estimateForm') as FormArray;
    const taskArray = estimateFormArray.at(taskIndex).get('taskDetails') as FormArray;
    taskArray.removeAt(detailIndex);
  }

/**
 * @description | returns the FormGroup to the FormArray taskDetails 
 * @returns | formGroup
 */
  addTaskDetails(){
    return this.fb.group({
      team:['',Validators.required],
      givenBy:['',Validators.required],
      hours:['',Validators.required],
      link:['',Validators.required],
      info:['']
    })
  }

  /**
   * @description | Takes the Particular Task and Add the taskDetails into it
   * @param estimateFormArray | get Estimate FormControls
   * @param index | takes specific index
   */
  addMoreTaskDetails(estimateFormArray ,index){
    const taskArray= estimateFormArray.at(index).get('taskDetails') as FormArray;
    const newTaskDetails = this.addTaskDetails();
    taskArray.push(newTaskDetails);
  }

  /**
   * 
   * @param estimateFormArray | get Estimate Form controls
   * @param index | take The Specific index to increase the rowSpan
   * @returns | length of rowSpan to increase
   */
  getRowSpan(estimateFormArray,index){
    const taskArray= estimateFormArray.at(index).get('taskDetails') as FormArray;
    return taskArray.length;
  }

  /**
   * 
   * @param link | takes the link object 
   * @returns | link to be downloaded
   */
  download(link){
    const data = `${link.baseUrl}${link.file}`;
    return data;
  }
/**
 * 
 * @param type | toggle between query and Estimate
 */
  estimateType(type){
    if (type == 1) {
      this.displayColor=true;
    } 
    else {
      this.displayColor=false;
    }
  }
  /**
   * 
   * @param bidDocs | docs from bidding Form
   * @param estimateDocs | docs from estimate Form
   * @returns | returns the Combined docs Array
   */
  getAllDocs(bidDocs, estimateDocs){
    const allDocs = [...bidDocs , ...estimateDocs];
    if(allDocs.length!=0) return allDocs;
  }


  /**
   * Submits the Form Created in HTML View
   */
  onSubmitForm(){
    console.log(this.employeeEstimateForm.value);
    if(this.employeeEstimateForm.valid){
      console.log(this.employeeEstimateForm.value);
    }
  }



  /**
   * Checks if that row-col is present or not 
   * @param row | row
   * @param col | col
   * @returns | true/false
   */
  isCellBeingEdited(row,col){
    return this.editedCellIndices.some(cell => cell.row === row && cell.col === col);
  }


  /**
   * mark index as saved in array
   * @param index | team index
   */
  setSaveIndexForCell(row: number,col:number): void {
    const editIndex =  this.editedCellIndices.findIndex(cell => cell.row === row && cell.col === col);
    if (editIndex==-1) {
      this.editedCellIndices.push({ row, col });
    }
  }

  /**
   *  Checks the index is present in the EditingCellIndices and removes it from it
   * @param index | team index
   */
  setEditIndexForCell(row: number,col:number): void {
    const editIndex =  this.editedCellIndices.findIndex(cell => cell.row === row && cell.col === col);
    if(editIndex !== -1) {
    this.editedCellIndices.splice(editIndex,1);
  }
}

  /**
   * Removes the index 
   * @param index | team index
   */
  clearEditIndexForCell(row: number,col:number): void {
    const editIndex =  this.editedCellIndices.findIndex(cell => cell.row === row && cell.col === col);
    if(editIndex !== -1) {
      this.editedCellIndices.splice(editIndex,1);
    }
  }

}
