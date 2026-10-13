# Travel Planner – duomenų modelis

## 1. Duomenų modelio paskirtis

Travel Planner aplikacija saugos vartotojų keliones ir jų metu planuojamas veiklas. Duomenys bus laikomi Supabase PostgreSQL duomenų bazėje.

## 2. Lentelės

### auth.users
Supabase Auth valdoma vartotojų autentifikavimo lentelė.

Pagrindinis laukas:
- id – UUID, pirminis raktas.

### trips
Kelionių lentelė.

- id – UUID, PRIMARY KEY.
- user_id – UUID, NOT NULL, FOREIGN KEY į auth.users(id).
- title – TEXT, NOT NULL.
- country – TEXT, NOT NULL.
- city – TEXT, NOT NULL.
- start_date – DATE, NOT NULL.
- end_date – DATE, NOT NULL.
- description – TEXT, neprivalomas.
- created_at – TIMESTAMPTZ, NOT NULL.
- updated_at – TIMESTAMPTZ, NOT NULL.

### activities
Kelionės veiklų lentelė.

- id – UUID, PRIMARY KEY.
- trip_id – UUID, NOT NULL, FOREIGN KEY į trips(id).
- title – TEXT, NOT NULL.
- activity_date – DATE, NOT NULL.
- activity_time – TIME, neprivalomas.
- location – TEXT, neprivalomas.
- notes – TEXT, neprivalomas.
- is_completed – BOOLEAN, NOT NULL, numatytoji reikšmė false.
- created_at – TIMESTAMPTZ, NOT NULL.
- updated_at – TIMESTAMPTZ, NOT NULL.

## 3. Lentelių ryšiai

- auth.users (1) → (N) trips.
- trips (1) → (N) activities.
- Ištrynus kelionę, ištrinamos jos veiklos.
- Kelionės dienos apskaičiuojamos pagal start_date ir end_date.

## 4. Duomenų apribojimai

- Visi įrašai turi turėti unikalų ID.
- Privalomi pavadinimai negali būti tušti ar sudaryti vien iš tarpų.
- Kelionės pabaigos data negali būti ankstesnė už pradžios datą.
- Veiklos data turi būti kelionės laikotarpyje.
- Veikla privalo priklausyti egzistuojančiai kelionei.
- Prisijungęs vartotojas gali valdyti tik savo duomenis.
- Kelionės datų pakeitimas neturi palikti veiklų už naujo kelionės laikotarpio ribų.

## 5. CRUD operacijos

### Kelionės
- CREATE – sukurti naują kelionę.
- READ – gauti kelionių sąrašą ir vienos kelionės informaciją.
- UPDATE – pakeisti kelionės informaciją.
- DELETE – ištrinti kelionę ir jos veiklas.

### Veiklos
- CREATE – pridėti veiklą prie kelionės.
- READ – gauti pasirinktos kelionės veiklas.
- UPDATE – pakeisti veiklą arba jos atlikimo būseną.
- DELETE – pašalinti veiklą.

## 6. Galimos klaidos

- Neužpildyti privalomi laukai.
- Neteisinga kelionės ar veiklos data.
- Veikla priskiriama neegzistuojančiai kelionei.
- Kelionė ar veikla nerasta.
- Vartotojas neturi prieigos prie įrašo.
- Nepavyksta prisijungti prie duomenų bazės.
- Nepavyksta išsaugoti, atnaujinti ar ištrinti įrašo.

## 7. Duomenų saugumas

- Naudojamas Supabase Auth.
- Įjungiamas Row Level Security (RLS).
- Kelionės pasiekiamos tik jų savininkui.
- Veiklos pasiekiamos tik per vartotojui priklausančias keliones.
- Supabase service_role raktas niekada nelaikomas React kliento kode.

## 8. Techninis įgyvendinimas

Duomenų modelis bus įgyvendintas Supabase SQL Editor. SQL skriptas apims lentelių sukūrimą, pirminius ir išorinius raktus, apribojimus, indeksus, RLS taisykles ir reikalingus duomenų validacijos mechanizmus.