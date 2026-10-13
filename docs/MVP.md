# Travel Planner – MVP specifikacija

## 1. Projekto tikslas

Sukurti internetinę kelionių planavimo aplikaciją, leidžiančią vartotojui vienoje vietoje kurti keliones, planuoti jų dienas ir organizuoti lankytinas vietas bei veiklas.

## 2. Tikslinė auditorija

Savarankiškai keliaujantys žmonės, poros, šeimos ir draugų grupės, norinčios patogiai susiplanuoti kelionės eigą.

## 3. MVP funkcionalumai

### F1. Naujos kelionės sukūrimas
**Prioritetas:** P0

Vartotojas gali sukurti naują kelionę, įvesdamas:
- Kelionės pavadinimą.
- Šalį.
- Miestą.
- Kelionės pradžios datą.
- Kelionės pabaigos datą.
- Aprašymą (neprivaloma).

**Priėmimo kriterijai:**
- Visi privalomi laukai turi būti užpildyti.
- Pabaigos data negali būti ankstesnė už pradžios datą.
- Sėkmingai sukurta kelionė išsaugoma Supabase.
- Vartotojas mato sėkmės pranešimą.

### F2. Kelionių sąrašo peržiūra
**Prioritetas:** P0

Vartotojas mato visas sukurtas keliones.

**Priėmimo kriterijai:**
- Rodomas kelionės pavadinimas, vieta ir datos.
- Kelionės nuskaitomos iš Supabase.
- Jeigu kelionių nėra, rodoma tuščio sąrašo būsena.
- Vartotojas gali pasirinkti kelionę ir peržiūrėti jos informaciją.

### F3. Kelionės redagavimas ir ištrynimas
**Prioritetas:** P0

Vartotojas gali keisti kelionės informaciją arba ją ištrinti.

**Priėmimo kriterijai:**
- Redaguojant taikoma tokia pati validacija kaip kuriant.
- Pakeitimai išsaugomi duomenų bazėje.
- Prieš ištrinant prašoma patvirtinimo.
- Ištrinta kelionė pašalinama iš sąrašo kartu su jai priklausančiomis veiklomis.

### F4. Kelionės dienų peržiūra
**Prioritetas:** P0

Atidarius kelionę vartotojas mato jos dienas pagal pasirinktas datas.

**Priėmimo kriterijai:**
- Dienos pateikiamos chronologine tvarka.
- Kiekvienai dienai galima peržiūrėti suplanuotas veiklas.
- Jei dienai veiklų nėra, rodomas atitinkamas pranešimas.

### F5. Veiklų pridėjimas
**Prioritetas:** P0

Vartotojas gali pridėti veiklą konkrečiai kelionės dienai.

**Veiklos duomenys:**
- Veiklos pavadinimas.
- Data.
- Laikas (neprivaloma).
- Lankytina vieta (neprivaloma).
- Pastabos (neprivaloma).

**Priėmimo kriterijai:**
- Veiklos pavadinimas privalomas.
- Veiklos data turi patekti į kelionės laikotarpį.
- Veikla išsaugoma Supabase.
- Nauja veikla rodoma pasirinktos dienos sąraše.

### F6. Veiklų valdymas
**Prioritetas:** P1

Vartotojas gali redaguoti, ištrinti ir pažymėti veiklą kaip atliktą.

**Priėmimo kriterijai:**
- Veiklos informaciją galima atnaujinti.
- Veiklą galima pašalinti.
- Atlikimo būsena išsaugoma duomenų bazėje.

## 4. Pagrindiniai aplikacijos puslapiai

1. **Kelionių sąrašas (Dashboard)** – visos suplanuotos kelionės.
2. **Naujos kelionės puslapis** – kelionės kūrimo forma.
3. **Kelionės detalės** – datos, dienos ir veiklos.
4. **Veiklos forma** – naujos veiklos kūrimas ir redagavimas.

## 5. Neįtrauktos funkcijos

Pirmoje MVP versijoje nebus:
- AI generuojamų kelionių planų.
- Interaktyvių žemėlapių.
- Automatinio maršrutų optimizavimo.
- Skrydžių ar viešbučių rezervavimo.
- Kelionės biudžeto skaičiuoklės.

Šias funkcijas galima įtraukti ateityje.

## 6. Technologijos

- Frontend: React + Vite.
- Programavimo kalba: JavaScript.
- Stilius: CSS.
- Duomenų bazė: Supabase PostgreSQL.
- Versijų kontrolė: Git ir GitHub.
- Kūrimo aplinka: Cursor ir Codex.

## 7. Duomenų saugojimas

Kelionių ir veiklų duomenys bus saugomi Supabase duomenų bazėje.

Pirmoji versija bus skirta vienam vartotojui. Prieš prijungiant duomenų bazę bus pasirinktas saugus prieigos modelis, pavyzdžiui, prisijungimas per Supabase Auth.

## 8. MVP užbaigimo kriterijai

MVP laikomas baigtu, kai:
- Vartotojas gali sukurti kelionę.
- Gali peržiūrėti, redaguoti ir ištrinti keliones.
- Gali matyti kelionės dienas.
- Gali pridėti veiklas prie pasirinktų dienų.
- Duomenys išlieka perkrovus puslapį.
- Formos tikrina neteisingus duomenis.
- Klaidų ir tuščių sąrašų būsenos rodomos suprantamai.
- Aplikacija veikia kompiuterio ir telefono ekranuose.