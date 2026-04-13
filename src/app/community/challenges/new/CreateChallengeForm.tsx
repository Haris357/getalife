'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Input from '@mui/joy/Input'
import Textarea from '@mui/joy/Textarea'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'

const CATEGORIES = ['fitness', 'mindfulness', 'learning', 'productivity', 'nutrition', 'other']

export default function CreateChallengeForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('fitness')
  const [durationDays, setDurationDays] = useState(30)
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          duration_days: durationDays,
          start_date: startDate || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create challenge')
        setLoading(false)
        return
      }

      router.push('/community/challenges')
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const inputSx = {
    bgcolor: 'background.surface',
    borderColor: 'divider',
    fontSize: '0.88rem',
    '--Input-focusedThickness': '1px',
    '--Input-focusedHighlight': 'rgb(14,165,233)',
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.tertiary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          title
        </Typography>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. 30-Day Morning Routine Challenge"
          required
          sx={inputSx}
        />
      </Box>

      {/* Description */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.tertiary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          description
        </Typography>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What is this challenge about? What should participants do each day?"
          required
          minRows={3}
          sx={{ ...inputSx, '--Textarea-focusedThickness': '1px', '--Textarea-focusedHighlight': 'rgb(14,165,233)' }}
        />
      </Box>

      {/* Category */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.tertiary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          category
        </Typography>
        <Select
          value={category}
          onChange={(_, val) => setCategory(val ?? 'fitness')}
          sx={inputSx}
        >
          {CATEGORIES.map(cat => (
            <Option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Option>
          ))}
        </Select>
      </Box>

      {/* Duration */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.tertiary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          duration (days)
        </Typography>
        <Input
          type="number"
          value={durationDays}
          onChange={e => setDurationDays(parseInt(e.target.value) || 30)}
          slotProps={{ input: { min: 1, max: 365 } }}
          required
          sx={inputSx}
        />
      </Box>

      {/* Start date (optional) */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.tertiary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          start date <Box component="span" sx={{ opacity: 0.4, fontWeight: 400 }}>(optional — defaults to today)</Box>
        </Typography>
        <Input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          sx={inputSx}
        />
      </Box>

      {error && (
        <Typography sx={{ fontSize: '0.82rem', color: 'danger.500' }}>
          {error}
        </Typography>
      )}

      <Box
        component="button"
        type="submit"
        disabled={loading || !title.trim() || !description.trim()}
        sx={{
          px: 3,
          py: 1.25,
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, rgb(14,165,233) 0%, rgb(249,115,22) 100%)',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading || !title.trim() || !description.trim() ? 0.6 : 1,
          transition: 'opacity 0.15s',
          mt: 1,
        }}
      >
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
          {loading ? 'creating...' : 'Create Challenge'}
        </Typography>
      </Box>
    </Box>
  )
}
