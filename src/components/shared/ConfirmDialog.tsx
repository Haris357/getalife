'use client'

import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import Modal from '@mui/joy/Modal'
import ModalDialog from '@mui/joy/ModalDialog'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel}>
      <ModalDialog
        sx={{
          maxWidth: 400,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.surface',
          boxShadow: 'lg',
          p: 3.5,
        }}
      >
        <Typography
          level="title-md"
          sx={{ color: 'text.primary', fontWeight: 700, mb: description ? 1 : 2.5 }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            level="body-sm"
            sx={{ color: 'text.tertiary', opacity: 0.7, lineHeight: 1.6, mb: 3 }}
          >
            {description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            sx={{
              borderRadius: '8px',
              borderColor: 'divider',
              color: 'text.tertiary',
              fontWeight: 600,
              '&:hover': { borderColor: 'neutral.outlinedBorder', bgcolor: 'background.level1' },
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            color={danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            {confirmLabel}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  )
}
