import { createAsyncThunk } from "@reduxjs/toolkit"
import { ApiError, careNotesApi, DEFAULT_PAGE_SIZE } from "../../api/careNotesAPI"
import type {
  CareNote,
  CareNoteDraft,
  CareStats,
  PaginatedNotesResponse,
  RootState,
} from "../../types"
import type { NoteFieldErrors } from "../../utils/validateNote"

/**
 * Thunks are the only place that knows the API exists. Components dispatch
 * intent ("refresh the notes"); the thunk reads the current filters off the
 * store so no caller has to assemble a query.
 */

const messageFor = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

interface ThunkConfig {
  state: RootState
  rejectValue: string
}

export const fetchNotes = createAsyncThunk<
  PaginatedNotesResponse,
  { page?: number } | undefined,
  ThunkConfig
>("careNotes/fetchNotes", async (args, { getState, rejectWithValue }) => {
  const { filters, pagination } = getState().careNotes

  try {
    return await careNotesApi.listNotes({
      page: args?.page ?? pagination.currentPage,
      pageSize: pagination.pageSize || DEFAULT_PAGE_SIZE,
      facilityIds: filters.facilityIds,
    })
  } catch (error) {
    return rejectWithValue(messageFor(error, "Could not load care notes."))
  }
})

export const fetchStats = createAsyncThunk<CareStats, void, ThunkConfig>(
  "careNotes/fetchStats",
  async (_, { getState, rejectWithValue }) => {
    const { filters } = getState().careNotes

    try {
      return await careNotesApi.getStats({
        range: filters.dateRange,
        facilityIds: filters.facilityIds,
      })
    } catch (error) {
      return rejectWithValue(messageFor(error, "Could not load statistics."))
    }
  },
)

/** What a failed save tells the form: a message, plus any per-field detail. */
export interface CreateNoteFailure {
  message: string
  fields: NoteFieldErrors
}

/**
 * Create a note.
 *
 * The rejection is a structured value rather than a thrown error: Redux
 * Toolkit serialises thrown errors, which would strip the per-field detail
 * the form needs to attach messages to inputs.
 */
export const createNote = createAsyncThunk<
  CareNote,
  { draft: CareNoteDraft; facilityId?: number },
  { state: RootState; rejectValue: CreateNoteFailure }
>("careNotes/createNote", async ({ draft, facilityId }, { rejectWithValue }) => {
  try {
    return await careNotesApi.createNote(draft, facilityId)
  } catch (error) {
    return rejectWithValue({
      message: messageFor(error, "Could not save the note."),
      fields: error instanceof ApiError ? error.fields : {},
    })
  }
})
