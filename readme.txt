-database name is company name 
-collectionName is fmsCollection
-add these thwo values in .env file
-add router 
-create repo and push the code // merge the code to main backend
-create login pool initialisation based on user -- connect to that specific company db
-eachdb is one company 
-each db has multiple collections for that company , fms master and detail fms
-whenever an fms is initialised for the first time , approval has to be done -- add names on who to approve this(optioanl feature)
-who has access to this fms -change it to fmsFormAccess  - store ID's
-fmsQuestionare change it to fmsInitialForm
-in questionare  - ignore startEndDateTime
-fmsQuestionaeAccess - store both ID and name in an object and make it array of objects 
-add a key for each fms  - at what point is this fms live (live or not live -- status -- give it a boolean - true after all steps are completed and saved(in view fms))


steps
what has to be done - description
who - if all shift - can be assigned to only 1 person
    - if it is Individual Shift 
    - save the shift id and employee id ( for individual shift)
when will you do this step - STRING
How will you do this step
    1) none  - STRING -- add a training link ( how to do a task , maybe an Youtube link)
    2)Checklist - check with salman for frequescy part of Checklist
                -RENAME IT TO CHECKLIST steps FROM MINI STEPS
                -SUBSETS Check with salman
    -Form is there even for checklist and reference format
    -in reerence format there will only be instructions to do that step - array of strings
    -in every step - in how  - the form is non mandatory
    -whatever we do in how , that will be the payload for the task
-lastkey for every step is "type" - "doer" or "quality"
-by default the type is "doer"
-create a step id
-create a fms id as well******************************************
-steps - start time - by default previous steps actual date time (for now ignore the start time)
-T-X --> duration is some , start time is not previous step time , dropdown i need send all the date time formats as options -- T is date time and x is number*hr or d



--location was is not required
--how - (checklist , reference, none) - either of these 3 


--fms initialisdation name - give an option to change it 

ngrok token  -2fHbiUaddJBLgvfxUdXfxCoVbXQ_4KJMC3ATzhSn5EwAq2Xt6
















