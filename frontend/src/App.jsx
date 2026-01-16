
import { useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'


function App() {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    school: '',
    school_other: '',
    purpose: '',
    purpose_other: '',
    lab_name: '',
    lab_faculty: '',
    job_type: '',
    material: '',
    material_other: '',
    size: '',
    notes: ''
  })

  
const [files, setFiles] = useState([])


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }


  const handleFileChange = (e) => {
  setFiles(Array.from(e.target.files))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    // 1. Insert job into database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([{
        email: formData.email,
        role: formData.role,
        school: formData.school === 'Other' ? formData.school_other : formData.school,
        purpose: formData.purpose === 'Other' ? formData.purpose_other : formData.purpose,
        lab_name: formData.purpose === 'Research lab' ? formData.lab_name : null,
        lab_faculty: formData.purpose === 'Research lab' ? formData.lab_faculty : null,
        job_type: formData.job_type,
        material: formData.material === 'Other' ? formData.material_other : formData.material,
        size: formData.size,
        notes: formData.notes || null
      }])
      .select()
    
    if (jobError) throw jobError
    
    const jobId = job[0].id
    
    // 2. Upload files and create file records
    for (const file of files) {
      // Upload to storage
      const filePath = `${jobId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Create file record in database
      const { error: fileError } = await supabase
        .from('files')
        .insert([{
          job_id: jobId,
          file_name: file.name,
          file_path: filePath
        }])
      
      if (fileError) throw fileError
    }
    
    alert('Job submitted successfully!')
    
    // Reset form
    setFormData({
      email: '',
      role: '',
      school: '',
      school_other: '',
      purpose: '',
      purpose_other: '',
      lab_name: '',
      lab_faculty: '',
      job_type: '',
      material: '',
      material_other: '',
      size: '',
      notes: ''
    })
    setFiles([])
    
  } catch (error) {
    console.error('Error submitting job:', error)
    alert('Error submitting job: ' + error.message)
  }
}

  return (
    <div className="App">
      <h1>Makerspace Job Submission</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Role:</label>
          <select name="role" value={formData.role} onChange={handleChange} required>
            <option value="">Select role...</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Staff">Staff</option>
          </select>
        </div>

        <div>
          <label>School:</label>
          <select name="school" value={formData.school} onChange={handleChange} required>
            <option value="">Select school...</option>
            <option value="School of Engineering">School of Engineering</option>
            <option value="College of Arts and Science">College of Arts and Science</option>
            <option value="Peabody College">Peabody College</option>
            <option value="School of Medicine">School of Medicine</option>
            <option value="School of Nursing">School of Nursing</option>
            <option value="Owen Graduate School of Management">Owen Graduate School of Management</option>
            <option value="Divinity School">Divinity School</option>
            <option value="Blair School of Music">Blair School of Music</option>
            <option value="Law School">Law School</option>
            <option value="Next Steps">Next Steps</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {formData.school === 'Other' && (
          <div>
            <label>Please specify school:</label>
            <input
              type="text"
              name="school_other"
              value={formData.school_other}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div>
          <label>Project Purpose:</label>
          <select name="purpose" value={formData.purpose} onChange={handleChange} required>
            <option value="">Select purpose...</option>
            <option value="Personal project">Personal project</option>
            <option value="Class project">Class project</option>
            <option value="Student organization">Student organization</option>
            <option value="Senior design">Senior design</option>
            <option value="Research lab">Research lab</option>
            <option value="VUMC">VUMC</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {formData.purpose === 'Other' && (
          <div>
            <label>Please specify purpose:</label>
            <input
              type="text"
              name="purpose_other"
              value={formData.purpose_other}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {(formData.purpose === 'Research lab' || formData.purpose === 'VUMC') && (
          <>
            <div>
              <label>Lab Name:</label>
              <input
                type="text"
                name="lab_name"
                value={formData.lab_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Lab Faculty:</label>
              <input
                type="text"
                name="lab_faculty"
                value={formData.lab_faculty}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        <div>
          <label>Job Type:</label>
          <select name="job_type" value={formData.job_type} onChange={handleChange} required>
            <option value="">Select type...</option>
            <option value="3D Print">3D Print</option>
            <option value="Laser Cut">Laser Cut</option>
          </select>
        </div>

         {(formData.job_type === 'Laser Cut') && (
          <>
           <div>
          <label>Material:</label>
          <select name="material" value={formData.material} onChange={handleChange} required>
            <option value="">Select material...</option>
            <option value="MDF (1/4 inch)">MDF (1/4 inch)</option>
            <option value="Plywood (1/8 inch)">Plywood (1/8 inch)</option>
            <option value="Cardboard (1/8 inch)">Cardboard (1/8 inch)</option>
            <option value="Acrylic (1/8 inch)">Acrylic (1/8 inch)</option>
            <option value="Acrylic (1/4 inch)">Acrylic (1/4 inch)</option>
            <option value="Other">Other</option>
          </select>
        </div>

        
        {formData.material === 'Other' && (
          <div>
            <label>Please specify material:</label>
            <input
              type="text"
              name="material_other"
              value={formData.material_other}
              onChange={handleChange}
              required
            />
          </div>
        )}
          </>
        )}

      


        <div>
          <label>Size/Dimensions:</label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            required
            placeholder="e.g., 10cm x 10cm x 5cm"
          />
        </div>

        <div>
          <label>Notes (optional):</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Any additional information..."
          />
        </div>


        <div>
  <label>Upload Files (STL, 3MF, DXF, DWG):</label>
  <input
    type="file"
    onChange={handleFileChange}
    accept=".stl,.3mf,.dxf,.dwg"
    multiple
    required
  />
  {files.length > 0 && (
    <div>
      <p>Selected files:</p>
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>
    </div>
  )}
</div>

        <button type="submit">Submit Job</button>
      </form>
    </div>
  )
}

export default App