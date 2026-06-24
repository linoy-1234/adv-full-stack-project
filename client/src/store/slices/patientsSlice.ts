import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
  type PatientPayload,
} from "../../services/patientService";

import type { PatientProfile } from "../../types/api";

interface PatientsState {
  list: PatientProfile[];
  selectedPatient: PatientProfile | null;
  loading: boolean;
  error: string | null;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const fetchPatients = createAsyncThunk<
  PatientProfile[],
  void,
  { rejectValue: string }
>("patients/fetchPatients", async (_, { rejectWithValue }) => {
  try {
    const data = await getPatients();
    return data.patients || [];
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to load patients")
    );
  }
});

export const fetchPatientById = createAsyncThunk<
  PatientProfile,
  string,
  { rejectValue: string }
>("patients/fetchPatientById", async (patientId, { rejectWithValue }) => {
  try {
    const data = await getPatientById(patientId);
    return data.patient;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to load patient")
    );
  }
});

export const addPatient = createAsyncThunk<
  PatientProfile,
  PatientPayload,
  { rejectValue: string }
>("patients/addPatient", async (patientData, { rejectWithValue }) => {
  try {
    const data = await createPatient(patientData);
    return data.patient;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to create patient")
    );
  }
});

export const editPatient = createAsyncThunk<
  PatientProfile,
  { patientId: string; patientData: Partial<PatientPayload> },
  { rejectValue: string }
>(
  "patients/editPatient",
  async ({ patientId, patientData }, { rejectWithValue }) => {
    try {
      const data = await updatePatient(patientId, patientData);
      return data.patient;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update patient")
      );
    }
  }
);

export const removePatient = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("patients/removePatient", async (patientId, { rejectWithValue }) => {
  try {
    await deletePatient(patientId);
    return patientId;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to delete patient")
    );
  }
});

const initialState: PatientsState = {
  list: [],
  selectedPatient: null,
  loading: false,
  error: null,
};

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    clearPatientsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load patients";
      })

      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load patient";
      })

      .addCase(addPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(addPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create patient";
      })

      .addCase(editPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editPatient.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPatient = action.payload;

        state.list = state.list.map((patient) =>
          patient._id === updatedPatient._id ? updatedPatient : patient
        );

        if (state.selectedPatient?._id === updatedPatient._id) {
          state.selectedPatient = updatedPatient;
        }
      })
      .addCase(editPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update patient";
      })

      .addCase(removePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePatient.fulfilled, (state, action) => {
        state.loading = false;
        const deletedPatientId = action.payload;

        state.list = state.list.filter(
          (patient) => patient._id !== deletedPatientId
        );

        if (state.selectedPatient?._id === deletedPatientId) {
          state.selectedPatient = null;
        }
      })
      .addCase(removePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete patient";
      });
  },
});

export const { clearSelectedPatient, clearPatientsError } =
  patientsSlice.actions;

export default patientsSlice.reducer;

//saves the patient list in Redux
//loads patients from the server, CRUD, saves laoding/error
