import { HttpClient } from '@angular/common/http';
import {  Component,Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { CLASS } from 'src/app/common/class.constant';
import { AppConstants, PageTitles } from 'src/app/common/constant';
import { InfoModalComponent } from '../info-modal/info-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DETAILS_INFO } from 'src/app/common/info-constant';
import { AlertService } from 'src/app/services/alert-service/alert.service';

@Component({
  selector: 'app-shared-details-page',
  templateUrl: './shared-details-page.component.html',
  styleUrls: ['./shared-details-page.component.scss']
})
export class SharedDetailsPageComponent implements OnInit,OnChanges {
  ZERO =0;
  MINUS_ONE=-1;
  patchFormData;
  isLocked=false;
  submitted=false;
  classValue=CLASS;
  editCellList:any;
  dateFormat = "dd/MM/yyyy";
  employeeEstimateForm!:FormGroup;
  emptyValue = AppConstants.EmptyValue;
  dateTimeFormat = "dd MMM yyyy hh:mm a";
  titles = PageTitles.EMPLOYEE_ESIMATES;
  successMessage='Task Created Successfully';
  updateMessage = 'Task Updated Successfully';
  errorMessage = `You can only edit your Team's Estimate Hours`;
  API_ESTIMATE_QUERY='http://192.180.0.127:4149/api/estimateTask';
  API_LOCK_ESTIMATE= 'http://192.180.0.127:4149/api/estimate/lock';

  list=[];
  header = [];
  teamArray=[];
  givenByArray=[];
  taskNameArray=[];
  patchFormControlName =['taskName','id','link','comments'];

  @Input() records;
  @Input() canMessage;
  @Input() estimateId;
  @Input() teamDetails;
  @Input() isManagement=false;
  @Input() teamEstimate;
  @Input() adminPanelEstimate;
  displayValue=1;
  private editedCellIndices: any = [];
  private alreadyEditedCells:any=[]
  constructor(private fb:FormBuilder,private ngModal:NgbModal,private http:HttpClient,private alertService:AlertService) { 
  }

  /**
   * LifeCycle Hook
   */
  ngOnInit(): void {
    this.initEstimateForm();
}

  /**
   * LifeCycle Hook
   * @param changes | Simple Changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if(changes?.teamEstimate?.currentValue){
      const teamEstimate = changes?.teamEstimate?.currentValue;
      this.teamEstimate = teamEstimate;
      teamEstimate.forEach(team => {
        this.list.push(team._id);
      });
      this.setHeader();
      this.apiCalls();

    }
    
  }

  /**
   * Calls the FormArray Get Api
   */
  apiCalls(){
    this.http.get(`${this.API_ESTIMATE_QUERY}?estimateId=${this.estimateId}`).subscribe((res:any)=>{
      this.patchFormData=res?.data?.data;
      
      if(this.patchFormData.length){
          this.patchForm(this.patchFormData);
      }
    })
  }

  /**
 * Setting Headers for the Form
 */
  setHeader(){
    this.header=[
      {Name:'Task Name',Key:'normal',sorting:true,type:'taskName'},
      ...this.teamEstimate.map(team => ({ Name: team.name, Key: 'normal', type: 'team' })),
      {Name:'Link',Key:'normal',type:'link'}, 
      {Name:'Comments',Key:'normal',type:'additionalInfo'}, 
      ...(this.isManagement ? [] : [{ Name: 'Action' }])
    ]
  }

  /**
   * Create a Structure for Mapping the Editable Form
   */
  createEditCellList(){
    const hours = this.teamEstimate.map(team => {
      const teamHours = {};
      for (const tech of this.list) {
        teamHours[team?._id] = 0;
      }
      return teamHours;
    });
    hours.pop();
    this.editCellList = {
      taskName: 1,
      hours: hours,
      link: 0,
      info: 0
    };
    
  }

  /**
 * Create Form
 */
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
      hours:this.fb.array([this.addTech(this.teamEstimate)],Validators.required),
      link:[''],
      comments:[''],
      id:['']
    })
  }

  /**
   * 
   * @param teams | estimate Teams From Estimate Bids
   * @returns | formGroup
   */
  addTech(teams: any[]) {
    const techGroup = {};
    teams?.forEach(team => {
      techGroup[team._id] = [''];
    });
    return this.fb.group(techGroup);
  }
  
  /**
   * Function to Add More Tasks in the Table list
   */
  addMoreTasks(){
    if(!this.employeeEstimateForm.valid){
      const employeeTask  = this.employeeEstimateForm?.get('estimateForm') as FormArray;
      employeeTask.at(0)?.get('taskName').markAsTouched();
      employeeTask.at(0)?.get('taskName').updateValueAndValidity();
      return;
    } 
    this.addTask();
    this.createEditCellList();
    const cellData= {...this.editCellList};
    this.editedCellIndices.push(_.cloneDeep(cellData));
    const task ='taskName';
    const row = this.employeeEstimateForm.value?.estimateForm.length-1;
    this.alreadyEditedCells.push({ index:row, formControlName: task });
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
   * remove task From the lists of Tasks
   * @param taskIndex | taskIndex
   */
  removeTask(taskIndex:number){
    const obj =  {title:'Are you Sure Want to Delete Task', type:'error',text:''};
    this.alertService.confirmPopUp(obj).then((res)=>{
      if(res.value){
        const estimateFormArray = this.employeeEstimateForm.get('estimateForm') as FormArray;
        const taskId = estimateFormArray.value[taskIndex].id;
        estimateFormArray.removeAt(taskIndex);
        if(taskId){
        this.deleteFormData(taskId);
        }
      }
    });
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
      this.displayValue=1;
    } 
    else if(type==2) {
      this.displayValue=2;
    }
    else {
      this.displayValue=3;
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
  onSubmitForm(index){
    if(this.employeeEstimateForm.valid){
      const formData = this.employeeEstimateForm.value?.estimateForm;
      this.convertFormData(formData,index);
    }
  }

  /**
   * Converting Form Data into Suitable format to send to database
   * @param formData | formData
   * @param index | index
   */
  convertFormData(formData,index){
    const hours=[];
    let updatedData= formData[index];
    const teamIdKeys =Object.keys(updatedData?.hours[0]);
        teamIdKeys.forEach((teamId)=>{
        const teamObject= _.cloneDeep(this.teamEstimate.filter((team:any)=>team?._id==teamId));
        teamObject[0].teamId=teamObject[0]?._id;
        teamObject[0].teamName= teamObject[0]?.name
        teamObject[0].hours = updatedData?.hours[0][teamId];
        delete teamObject[0]?._id;
        delete teamObject[0]?.name;
        hours.push(...teamObject);
        });
    updatedData.hours = hours;
    updatedData.estimateId=this.estimateId;
    const taskId= updatedData?.id;
    delete updatedData.id;
    if(taskId){
      this.putFormData(updatedData,taskId);
    }
    else{
      this.postFormData(updatedData,index);
    }
    
  }

  /**
   * 
   * @param data | data
   * @param index | index
   */
  postFormData(data,index){
    this.http.post(`${this.API_ESTIMATE_QUERY}`,data).subscribe((res:any)=>{
      this.alertService.successToast(this.successMessage);
      ((this.employeeEstimateForm.get('estimateForm') as FormArray)
          ?.controls[index] as FormGroup
          )?.controls['id'].patchValue(res?.data?.id);
    })
  }

  /**
   * 
   * @param data | data
   * @param taskId | taskId
   */
  putFormData(data,taskId){
    this.http.put(`${this.API_ESTIMATE_QUERY}/${taskId}`,data).subscribe(()=>this.alertService.successToast(this.updateMessage));
  }

  /**
   *  delete the taskId
   * @param taskId |taskId
   */
  deleteFormData(taskId){
    this.http.delete(`${this.API_ESTIMATE_QUERY}/${taskId}`).subscribe();
  }

  /**
   * Patching form data
   * @param formData |FormData
   */
  patchForm(formData){
    formData.forEach((value,index)=>{
      this.addMoreTasks();
      
      for(let formControlName of this.patchFormControlName){
        ((this.employeeEstimateForm.get('estimateForm') as FormArray)
          ?.controls[index] as FormGroup
          )?.controls[formControlName].patchValue(value[formControlName]);
      }

      this.list.forEach((nestedFormControlName,hoursIndex)=>{
        const estimateFormArray= (this.employeeEstimateForm.get('estimateForm') as FormArray);
        const taskArray = (estimateFormArray?.at(index)?.get('hours') as FormArray)?.controls;
        taskArray[0].get(nestedFormControlName).patchValue(value?.hours[hoursIndex]?.hours);
      })

      this.clearEditIndexForCell(index);
    });
    
  }

  /**
 * Returns if the current fields rendered in screen is Edited or not
 * @param index | formIndex
 * @param formControlName | FormControlName
 * @param formArrayName | FormArrayName
 * @returns | true/False
 */
  isCellBeingEdited(index,formControlName,formArrayName?:any){
    if(!formArrayName){
        return this.editedCellIndices[index][formControlName];
    }
    else{
      return this.editedCellIndices[index][formArrayName][0][formControlName];
    }
  }

  /**
   * conditionally renders the save button if any of the field is edited
   * @param index | current form Index
   * @returns | true/false
   */
  isRowBeingEdited(index){
    const isLockedArray =[];
    this.patchFormControlName.forEach((formControlName)=>{
      isLockedArray.push(this.editedCellIndices[index][formControlName]);
    });
    this.list.forEach((nestedFormControlName)=>{
      isLockedArray.push(this.editedCellIndices[index]['hours'][0][nestedFormControlName]);
    });
    return isLockedArray.some((val)=>val==1);
  }

  /**
   * when we Click on the field it will push that Values in editedCellIndices Array and Set those values to 1 
   * indicating those fields are still open to edit 
   * @param index |FormIndex
   * @param formControlName | FormControlName
   * @param formArrayName | FormArrayName
   */
  setEditIndexForCell(index,formControlName,formArrayName?:any): void {
    if(!formArrayName){
      this.editedCellIndices[index][formControlName]=1;
      this.alreadyEditedCells.push({ index, formControlName });
    }
    else{
      const canEditEstimate = this.teamDetails.some((team)=>team?._id===formControlName);
      if(canEditEstimate){
        const clonedValue = _.cloneDeep(this.editedCellIndices[index][formArrayName][0]);
        clonedValue[formControlName] = 1;
        this.editedCellIndices[index][formArrayName][0] = clonedValue;
        this.alreadyEditedCells.push({ index, formArrayName, formControlName });
      }
      else{
        this.alertService.errorToast(this.errorMessage);
      }
  }
}

  /**
   * Checks locked Status
   */
  getLockedBy(){
    if(this.records?.lockedBy){
      return this.records?.lockedBy;
    }
    return this.records?.lockedBy;
  }

  /**
   * function to block the cursor when estimate table is blocked
   * @returns |true/false
   */
  lockCursor(){
    if(this.getLockedBy()){
      const employeeId= localStorage.getItem('_id');
      if(employeeId==this.records?.lockedBy){
        return false;
      }
      else{
        return true;
      }
    }
  }

  /**
 * alert if the table is blocked
 */
  alertBlockedStatus(){
    if(this.lockCursor()){
      const message = `Estimate Form is Blocked by ${this.records?.lockedByDetails?.name}`;
      this.alertService.errorToast(message);
    }
  }

  /**
 * Used To Block the Estimate Request Screen 
 */
  isLockedEstimate(estimateId){
    const employeeId= localStorage.getItem('_id');
    if(!this.records?.lockedBy){
      const data = {isLocked:true};
      this.patchLockedEstimate(estimateId,data);
      return;
    }
    if(employeeId==this.records?.lockedBy ){
      const data = {isLocked:false};
      this.patchLockedEstimate(estimateId,data);
    }
    else {
      const message =`Estimate Form is Blocked by ${this.records?.lockedByDetails?.name}`;
      this.alertService.errorToast(message);
    }
  }

  /**
   * 
   * @param estimateId | estimate Id
   * @param data | locked Status
   */
  patchLockedEstimate(estimateId,data){
    this.http.patch(`${this.API_LOCK_ESTIMATE}/${estimateId}`,data).subscribe((res:any)=>{
      if(data?.isLocked){
        const employeeId=localStorage.getItem('_id');
        this.records.lockedBy=employeeId;
      }
      else {
        this.records.lockedBy='';
      }
    }) 
  }
  
  /**
 * Used to clear the formIndex input fields to close by clearing the corresponding cells in alreadyEditiedCells array
 * @param index | current FormIndex
 */
  clearEditIndexForCell(index): void {
    if(!this.employeeEstimateForm.valid) return;
    this.alreadyEditedCells.forEach((data) => {
      if (data.formArrayName) {
        this.editedCellIndices[index][data?.formArrayName][0][data?.formControlName] = 0;
      } 
      else {
        this.editedCellIndices[index][data?.formControlName] = 0;
      }
    });
  }

  /**
   * Used To show information 
   */
  openInfoModal(){
    const modal=this.ngModal.open(InfoModalComponent, {
      size: 'lg',
      centered: true,
    })
      modal.componentInstance.detailsData = DETAILS_INFO.ESTIMATE_QUERY_INFO;
    }
  
  } 
