import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  useDroppable,
  useDraggable
} from '@dnd-kit/core'

function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState(null)


    const [selectedJob, setSelectedJob] = useState(null)
    const [jobFiles, setJobFiles] = useState([])
    const [noteText, setNoteText] = useState('')
    const [showNoteInput, setShowNoteInput] = useState(false)

    const openJobDetails = async (job) => {
    setSelectedJob(job)
    setNoteText(job.staff_notes || '')
    
    // Fetch files for this job
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('job_id', job.id)
    
    if (!error) {
        setJobFiles(data || [])
    }
    }

    const closeJobDetails = () => {
    setSelectedJob(null)
    setJobFiles([])
    setNoteText('')
    setShowNoteInput(false)
    }

    const downloadFile = async (filePath, fileName) => {
    try {
        const { data, error } = await supabase.storage
        .from('job-files')
        .download(filePath)
        
        if (error) throw error
        
        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Error downloading file:', error)
        alert('Error downloading file: ' + error.message)
    }
    }

    const saveNote = async () => {
    try {
        const { error } = await supabase
        .from('jobs')
        .update({ staff_notes: noteText })
        .eq('id', selectedJob.id)
        
        if (error) throw error
        
        fetchJobs()
        closeJobDetails()
    } catch (error) {
        console.error('Error saving note:', error)
        alert('Error saving note: ' + error.message)
    }
    }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
      
      if (error) throw error
      setJobs(data)
      console.log('Fetched jobs:', data) 
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event) => {
    const job = jobs.find(j => j.id === event.active.id)
    setActiveJob(job)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveJob(null)

    if (!over) return

    const jobId = active.id
    const newStatus = over.id

    const job = jobs.find(j => j.id === jobId)
    if (job.status === newStatus) return // No change

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', jobId)
      
      if (error) throw error

      if (newStatus === 'in_progress') {
        console.log('TODO: Send "in progress" email to', job.email)
      } else if (newStatus === 'completed') {
        console.log('TODO: Send "completed" email to', job.email)
      }

      fetchJobs()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status: ' + error.message)
    }
  }

  const getJobsByStatus = (status) => {
    const filtered = jobs.filter(j => j.status === status)
    console.log(`Jobs with status "${status}":`, filtered)
    if (status === 'received') {
      return filtered.sort((a, b) => new Date(a.time_received) - new Date(b.time_received))
    } else if (status === 'completed') {
      return filtered.sort((a, b) => new Date(b.time_received) - new Date(a.time_received))
    }
    return filtered
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  const receivedJobs = getJobsByStatus('received')
  const inProgressJobs = getJobsByStatus('in_progress')
  const completedJobs = getJobsByStatus('completed')

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ padding: '20px' }}>
        <h1>Makerspace Dashboard</h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '20px',
          marginTop: '20px'
        }}>
          <Column
            id="received"
            title="Received"
            jobs={receivedJobs}
            color="#fff3cd"
            onCardClick={openJobDetails}
            />

            <Column
            id="in_progress"
            title="In Progress"
            jobs={inProgressJobs}
            color="#cfe2ff"
            onCardClick={openJobDetails}
            />

            <Column
            id="completed"
            title="Completed"
            jobs={completedJobs}
            color="#d1e7dd"
            onCardClick={openJobDetails}
            />
                    </div>
      </div>

      <DragOverlay>
        {activeJob ? (
          <div style={{
            background: 'white',
            border: '2px solid #333',
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontWeight: 'bold' }}>{activeJob.email}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div>{activeJob.job_type}</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {selectedJob && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
      position: 'relative'
    }}>
      <button 
        onClick={closeJobDetails}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
      
      <h2>Job Details</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Email:</strong> {selectedJob.email}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Job Type:</strong> {selectedJob.job_type}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Material:</strong> {selectedJob.material}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Size:</strong> {selectedJob.size}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>School:</strong> {selectedJob.school}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Purpose:</strong> {selectedJob.purpose}
      </div>
      {selectedJob.notes && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Student Notes:</strong> {selectedJob.notes}
        </div>
      )}
      
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <strong>Files:</strong>
        {jobFiles.length === 0 ? (
          <p>No files uploaded</p>
        ) : (
          <ul>
            {jobFiles.map(file => (
              <li key={file.id} style={{ marginBottom: '8px' }}>
                {file.file_name}
                <button 
                  onClick={() => downloadFile(file.file_path, file.file_name)}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    background: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <strong>Staff Notes:</strong>
        {!showNoteInput ? (
          <div>
            <p>{selectedJob.staff_notes || 'No notes yet'}</p>
            <button 
              onClick={() => setShowNoteInput(true)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {selectedJob.staff_notes ? 'Edit Note' : 'Add Note'}
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '8px',
                marginBottom: '8px'
              }}
            />
            <button 
              onClick={saveNote}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                cursor: 'pointer',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Save Note
            </button>
            <button 
              onClick={() => setShowNoteInput(false)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </DndContext>
  )
}

function Column({ id, title, jobs, color, onCardClick }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div style={{ 
      background: '#f8f9fa',
      borderRadius: '8px',
      padding: '15px'
    }}>
      <h2 style={{ marginTop: 0 }}>{title} ({jobs.length})</h2>
      <div
        ref={setNodeRef}
        style={{ 
          minHeight: '400px',
          background: color,
          borderRadius: '8px',
          padding: '10px'
        }}
      >
        {jobs.map(job => (
            <DraggableJobCard key={job.id} job={job} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  )
}
function DraggableJobCard({ job, onCardClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id
  })

  const style = {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '10px',
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    position: 'relative'
  }

  const handleClick = (e) => {
    // Only open details if not dragging
    if (!isDragging) {
      onCardClick(job)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      {job.staff_notes && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'red'
        }} />
      )}
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{job.email}</div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        <div>{job.job_type}</div>
        <div>{job.material}</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          {new Date(job.time_received).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard