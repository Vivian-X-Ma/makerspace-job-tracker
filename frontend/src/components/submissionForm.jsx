import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './submissionForm.css'

function SubmissionForm() {
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
    notes: '',
    lab_funding_acknowledged: false
  })

  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles([...files, ...newFiles])
    // Clear the input so the same file can be added again if removed
    e.target.value = ''
  }

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    })
  }

  // Calculate progress
  const getProgress = () => {
    const requiredFields = ['email', 'role', 'school', 'purpose', 'job_type', 'material', 'size']
    const conditionalFields = []

    if (formData.school === 'Other') conditionalFields.push('school_other')
    if (formData.purpose === 'Other') conditionalFields.push('purpose_other')
    if (formData.purpose === 'Research lab' || formData.purpose === 'VUMC') {
      conditionalFields.push('lab_name', 'lab_faculty')
    }
    if (formData.material === 'Other') conditionalFields.push('material_other')

    const allRequired = [...requiredFields, ...conditionalFields]
    const filled = allRequired.filter(field => formData[field]).length
    const hasFiles = files.length > 0

    const total = allRequired.length + 1 // +1 for files
    const progress = (filled + (hasFiles ? 1 : 0)) / total * 100

    return Math.round(progress)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          email: formData.email,
          role: formData.role,
          school: formData.school === 'Other' ? formData.school_other : formData.school,
          purpose: formData.purpose === 'Other' ? formData.purpose_other : formData.purpose,
          lab_name: formData.purpose === 'Research lab' || formData.purpose === 'VUMC' ? formData.lab_name : null,
          lab_faculty: formData.purpose === 'Research lab' || formData.purpose === 'VUMC' ? formData.lab_faculty : null,
          job_type: formData.job_type,
          material: formData.material === 'Other' ? formData.material_other : formData.material,
          size: formData.size,
          notes: formData.notes || null,
          lab_funding_acknowledged: formData.lab_funding_acknowledged
        }])
        .select()

      if (jobError) throw jobError

      const jobId = job[0].id

      for (const file of files) {
        const filePath = `${jobId}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('job-files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

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
      alert('Error submitting job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = getProgress()

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h1>Makerspace Job Submission</h1>
          <p className="subtitle">Submit your 3D printing or laser cutting request</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progress}% Complete</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Contact Information</h2>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@vanderbilt.edu"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="">Select your role...</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div className="form-group">
              <label>School *</label>
              <select name="school" value={formData.school} onChange={handleChange} required>
                <option value="">Select your school...</option>
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
              <div className="form-group fade-in">
                <label>Please specify school *</label>
                <input
                  type="text"
                  name="school_other"
                  value={formData.school_other}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Project Details</h2>

            <div className="form-group">
              <label>Project Purpose *</label>
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
              <div className="form-group fade-in">
                <label>Please specify purpose *</label>
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
              <div className="fade-in">
                <div className="form-group">
                  <label>Lab Name *</label>
                  <input
                    type="text"
                    name="lab_name"
                    value={formData.lab_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter lab name"
                  />
                </div>
                <div className="form-group">
                  <label>Lab Faculty *</label>
                  <input
                    type="text"
                    name="lab_faculty"
                    value={formData.lab_faculty}
                    onChange={handleChange}
                    required
                    placeholder="Enter faculty advisor name"
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="lab_funding_check"
                      name="lab_funding_acknowledged"
                      checked={formData.lab_funding_acknowledged}
                      onChange={handleCheckboxChange}
                      required
                    />
                    <label htmlFor="lab_funding_check" style={{ flex: 1 }}>
                      I understand that research labs with funding are asked to cover 3D printing material costs.
                      The Wondry can print this project for the lab and add it to a tab. Once the tab for the lab
                      is equivalent to one spool of filament (~$250), we will send an invoice/item number and link
                      it to the lab. Contact wondrymakerspace@gmail.com for further inquiry. *
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Job Specifications</h2>

            <div className="form-group">
              <label>Job Type *</label>
              <select name="job_type" value={formData.job_type} onChange={handleChange} required>
                <option value="">Select type...</option>
                <option value="3D Print">3D Print</option>
                <option value="Laser Cut">Laser Cut</option>
              </select>
            </div>


            {formData.job_type === 'Laser Cut' && (
              <>
                <div className="form-group">
                  <label>Material *</label>
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
                  <div className="form-group fade-in">
                    <label>Please specify material *</label>
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

            <div className="form-group">
              <label>Size/Dimensions *</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                required
                placeholder="e.g., 10cm x 10cm x 5cm"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any special instructions or requirements..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>File Upload</h2>

            <div className="form-group">
              <label>Upload Files (STL, 3MF, DXF, DWG) *</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".stl,.3mf,.dxf,.dwg"
                multiple
                required={files.length === 0}
                className="file-input"
              />
              {files.length > 0 && (
                <div className="file-list">
                  <p className="file-list-header">Selected files:</p>
                  <ul>
                    {files.map((file, index) => (
                      <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✕ Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Job Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm