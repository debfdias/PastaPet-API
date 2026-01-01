# Reminder Test Scenarios

All endpoints require authentication: `Authorization: Bearer <your-token>`

Base URL: `http://localhost:3000/api`

---

## Scenario 1: Vaccine Booster Reminder

**Endpoint:** `POST /api/vaccines`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "vaccineTypeId": "vaccine-type-uuid-here",
  "administrationDate": "2024-01-15T10:00:00Z",
  "nextDueDate": "2024-03-15T10:00:00Z",
  "booster": true,
  "administeredBy": "Dr. Smith",
  "notes": "First dose"
}
```

**Expected Result:**
- ✅ Vaccine record created
- ✅ **1 REMINDER created** with:
  - `reminderType`: `VACCINE_BOOSTER`
  - `reminderDate`: `2024-03-15T10:00:00Z` (2 months later)
  - `title`: `"Booster: [Vaccine Type Name]"`
  - `priority`: `HIGH`
  - `relatedRecordType`: `"vaccine"`

**Verify:**
```bash
GET /api/reminders?reminderType=VACCINE_BOOSTER
```

---

## Scenario 2: Treatment with End Date + Daily Medication (24h)

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Infecção",
  "description": "Tratamento para infecção",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-20T10:00:00Z",
  "medications": [
    {
      "name": "Antibiótico",
      "dosage": "500mg",
      "frequency": "Diariamente",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-20T10:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ Treatment created (5 days: Jan 15-20)
- ✅ **1 TREATMENT REMINDER** created:
  - `reminderType`: `TREATMENT_FOLLOWUP`
  - `reminderDate`: `2024-01-20T09:00:00Z` (end date at 9 AM)
  - `title`: `"Tratamento: Infecção - Seguimento"`
- ✅ **6 MEDICATION REMINDERS** created (daily at 10 AM):
  - Jan 15, 10:00 AM
  - Jan 16, 10:00 AM
  - Jan 17, 10:00 AM
  - Jan 18, 10:00 AM
  - Jan 19, 10:00 AM
  - Jan 20, 10:00 AM
  - `reminderType`: `MEDICATION`
  - `title`: `"Medicamento: Antibiótico (500mg)"`

**Verify:**
```bash
# Treatment reminder
GET /api/reminders?reminderType=TREATMENT_FOLLOWUP

# Medication reminders
GET /api/reminders?reminderType=MEDICATION
```

---

## Scenario 3: Treatment with Medication Every 12 Hours

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Dor",
  "startDate": "2024-01-15T22:00:00Z",
  "endDate": "2024-01-20T22:00:00Z",
  "medications": [
    {
      "name": "Analgésico",
      "dosage": "100mg",
      "frequency": "A cada 12h",
      "startDate": "2024-01-15T22:00:00Z",
      "endDate": "2024-01-20T22:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ Treatment created (5 days)
- ✅ **1 TREATMENT REMINDER** at end date
- ✅ **10 MEDICATION REMINDERS** created (every 12h):
  - Jan 15, 22:00 (10 PM)
  - Jan 16, 10:00 (10 AM)
  - Jan 16, 22:00 (10 PM)
  - Jan 17, 10:00 (10 AM)
  - Jan 17, 22:00 (10 PM)
  - Jan 18, 10:00 (10 AM)
  - Jan 18, 22:00 (10 PM)
  - Jan 19, 10:00 (10 AM)
  - Jan 19, 22:00 (10 PM)
  - Jan 20, 10:00 (10 AM)
  - Jan 20, 22:00 (10 PM)

**Verify:**
```bash
GET /api/reminders/pet/{petId}?reminderType=MEDICATION
```

---

## Scenario 4: Treatment with Medication Every 8 Hours (3x per day)

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Infecção grave",
  "startDate": "2024-01-15T08:00:00Z",
  "endDate": "2024-01-17T08:00:00Z",
  "medications": [
    {
      "name": "Antibiótico Forte",
      "dosage": "250mg",
      "frequency": "A cada 8h",
      "startDate": "2024-01-15T08:00:00Z",
      "endDate": "2024-01-17T08:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ **1 TREATMENT REMINDER** at end
- ✅ **9 MEDICATION REMINDERS** (every 8h for 2 days):
  - Jan 15: 08:00, 16:00, 00:00 (next day)
  - Jan 16: 08:00, 16:00, 00:00 (next day)
  - Jan 17: 08:00

---

## Scenario 5: Treatment with "X vezes ao dia" Format

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Tratamento",
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-18T09:00:00Z",
  "medications": [
    {
      "name": "Vitamina",
      "frequency": "2 vezes ao dia",
      "startDate": "2024-01-15T09:00:00Z",
      "endDate": "2024-01-18T09:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ **1 TREATMENT REMINDER**
- ✅ **8 MEDICATION REMINDERS** (every 12h = 24/2):
  - Jan 15: 09:00, 21:00
  - Jan 16: 09:00, 21:00
  - Jan 17: 09:00, 21:00
  - Jan 18: 09:00, 21:00

---

## Scenario 6: Treatment WITHOUT End Date

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Tratamento contínuo",
  "startDate": "2024-01-15T10:00:00Z",
  "medications": [
    {
      "name": "Medicação",
      "frequency": "Diariamente",
      "startDate": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ **1 TREATMENT REMINDER** at start date (to check on treatment)
- ✅ **30 MEDICATION REMINDERS** (defaults to 30 days if no end date)

---

## Scenario 7: Multiple Medications in One Treatment

**Endpoint:** `POST /api/treatments`

**Request Body:**
```json
{
  "petId": "pet-uuid-here",
  "cause": "Tratamento completo",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-20T10:00:00Z",
  "medications": [
    {
      "name": "Antibiótico",
      "frequency": "A cada 12h",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-20T10:00:00Z"
    },
    {
      "name": "Vitamina",
      "frequency": "Diariamente",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-20T10:00:00Z"
    }
  ]
}
```

**Expected Result:**
- ✅ **1 TREATMENT REMINDER**
- ✅ **10 REMINDERS** for Antibiótico (every 12h)
- ✅ **6 REMINDERS** for Vitamina (daily)
- ✅ **Total: 17 reminders**

---

## Scenario 8: Custom Manual Reminder

**Endpoint:** `POST /api/reminders`

**Request Body:**
```json
{
  "title": "Consulta veterinária",
  "description": "Levar pet para check-up anual",
  "reminderDate": "2024-02-15T14:00:00Z",
  "priority": "HIGH",
  "reminderType": "VET_APPOINTMENT",
  "petId": "pet-uuid-here"
}
```

**Expected Result:**
- ✅ **1 CUSTOM REMINDER** created
- ✅ User can manually manage it

---

## Scenario 9: Update Vaccine to Add Booster

**Endpoint:** `PUT /api/vaccines/{vaccineId}`

**Request Body:**
```json
{
  "booster": true,
  "nextDueDate": "2024-03-15T10:00:00Z"
}
```

**Expected Result:**
- ✅ Old booster reminder deleted (if existed)
- ✅ **New booster reminder created** for nextDueDate

---

## Scenario 10: Update Treatment Dates

**Endpoint:** `PUT /api/treatments/{treatmentId}`

**Request Body:**
```json
{
  "endDate": "2024-01-25T10:00:00Z"
}
```

**Expected Result:**
- ✅ Old treatment reminder deleted
- ✅ **New treatment reminder** created at new end date
- ⚠️ Medication reminders NOT updated (they keep original dates)

---

## Verification Endpoints

### Get All Reminders
```bash
GET /api/reminders?page=1&limit=50
```

### Get Unread Reminders
```bash
GET /api/reminders/unread?page=1&limit=50
```

### Get Reminders by Pet
```bash
GET /api/reminders/pet/{petId}?page=1&limit=50
```

### Filter by Type
```bash
GET /api/reminders?reminderType=MEDICATION
GET /api/reminders?reminderType=VACCINE_BOOSTER
GET /api/reminders?reminderType=TREATMENT_FOLLOWUP
```

### Filter by Priority
```bash
GET /api/reminders?priority=HIGH
GET /api/reminders?priority=MEDIUM
GET /api/reminders?priority=LOW
```

### Filter Unread
```bash
GET /api/reminders?isUnread=true
```

### Mark Reminder as Viewed
```bash
PATCH /api/reminders/{reminderId}/view
```

### Mark Reminder as Completed
```bash
PATCH /api/reminders/{reminderId}/complete
```

---

## Quick Test Checklist

- [ ] Vaccine booster creates reminder at nextDueDate
- [ ] Treatment with end date creates reminder at end
- [ ] Treatment without end date creates reminder at start
- [ ] Medication "Diariamente" creates daily reminders
- [ ] Medication "A cada 12h" creates twice-daily reminders
- [ ] Medication "A cada 8h" creates 3x daily reminders
- [ ] Medication "2 vezes ao dia" creates every 12h reminders
- [ ] Multiple medications create separate reminders
- [ ] Custom reminder can be created manually
- [ ] Updating vaccine booster updates reminder
- [ ] Updating treatment end date updates reminder



