# Makerspace Job Tracker

A tracker for Wond'ry Makerspace projects at Vanderbilt University

### User Guide

Access the site [here](https://makerspace-job-tracker.vercel.app) (https://makerspace-job-tracker.vercel.app) for the **submission form** and [here](https://makerspace-job-tracker.vercel.app/dashboard) (https://makerspace-job-tracker.vercel.app/dashboard) for the **job board**. The job board should only be used by MakerTechs and staff, so **please do not share the dashboard link.** 


#### Submission Form

This link brings you to the submission form.
![submission form](./src/assets/submission-form.png)

This form includes a progress tracker at the very top, and starred * fields are required. 

For labs and VUMC, there will be an additional pop-up menu that they need to fill out. 
![lab-form](./src/assets/lab-form.png)

For laser cuts, there will be a material selection tab, but not for 3D prints. If there are any additional requests for 3d prints, they can put it in the notes tab. The file upload allows for multiple attachments, and a remove option if the wrong file is uploaded. 
![files](./src/assets/laser-cut-and-upload.png)


#### Job Board






#### Troubleshooting

1. If you have errors with seeing the jobs, it is highly likely that the Supabase is inactive (we are using free tier and it will go inactive after 7 days if we have no submissions). MakerTechs, please go to Supabase, log in with our credentials, and restart the database, which will load everything in. This may take a few minutes. Since we will be using it every day, it should not have too many issues. 

2. If we cannot send emails, we likely have gone over our 100 email/day limit with Resend. 

3. If we cannot get any more files, we may be out of storage on Supabase. Upgrading is $20/month, which we can consider, but I will implement a cleanup function of our completed jobs to free up storage, so that should not be an issue (hopefully). 



### Versions

v1.1.0 - Integrating email notifications to users when completing jobs with Resend API
v1.0.1 - Adding User Guide
v1.0.0 - Fully working and deployed on Vercel
v0.3.0 - Integrated Supabase and fixed bugs with submission
v0.2.3 - Added a progress tracker to the submission form, and added a remove option for file uploads
v0.2.2 - Updated the job board to have drag and drop, and added a note feature
v0.2.1 - Fixed the submission form to have the correct options for labs/research
v0.2.0 - Added job board
v0.1.0 - Created submission form
