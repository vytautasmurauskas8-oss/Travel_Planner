# Travel Planner

Travel Planner – kelionių planavimo aplikacija, kurioje galima tvarkyti savo keliones ir kiekvienos kelionės dienotvarkę. Aplikacijos vartotojo sąsaja šiuo metu pateikiama anglų kalba.

## Technologijos

- React 19 ir JavaScript (JSX)
- Vite 8
- React Router
- Paprastas CSS
- Supabase Auth ir PostgreSQL su Row Level Security (RLS)

## Funkcijos

- Registracija, prisijungimas ir atsijungimas per Supabase Auth.
- Apsaugoti puslapiai: kelionių sąrašas, kelionės detalės, kūrimas ir redagavimas.
- Kelionių kūrimas, peržiūra, redagavimas ir ištrynimas.
- Kelionės dienų automatinis atvaizdavimas ir veiklų kūrimas, redagavimas bei ištrynimas.
- Formų validacija, įkėlimo / išsaugojimo būsenos, klaidų pranešimai ir nuskaitymo pakartojimas.
- Responsive išdėstymas telefonams, planšetėms ir kompiuteriams.

## Reikalavimai

- Node.js ir npm.
- Supabase projektas su šioje saugykloje esančia `supabase/schema.sql` schema.

## Paruošimas ir paleidimas

1. Įdiekite priklausomybes:

   ```bash
   npm install
   ```

2. Nukopijuokite `.env.example` į `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Užpildykite `.env.local` savo Supabase Project URL ir **Publishable key** reikšmėmis:

   ```dotenv
   VITE_SUPABASE_URL=https://jusu-projekto-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=jusu-publishable-key
   ```

   Reikšmes rasite Supabase projekto API nustatymuose. Kliento aplikacijai naudokite tik publishable/anon raktą; `service_role` ar kitų secret raktų į kliento kodą nedėkite. `.env.local` į Git neįtraukiamas.

3. Supabase SQL Editor vieną kartą paleiskite `supabase/schema.sql`, jei lentelės ir politikos dar nesukurtos.

4. Paleiskite kūrimo serverį:

   ```bash
   npm run dev
   ```

   Atverkite Vite terminale pateiktą vietinį adresą. Pakeitus `.env.local`, kūrimo serverį reikia paleisti iš naujo.

## Patikros komandos

```bash
npm run lint
npm run build
```

## Testavimo rezultatai

- Rankinis CRUD testavimas: **8/8 sėkmingi**.
- Rankinis validacijos testavimas: **8/8 sėkmingi**.
- Šie rankinio testavimo rezultatai pateikti projekto užduotyje; šiame paruošimo etape jie nebuvo pakartoti.
- Produkcinio build rezultatas: vykdykite `npm run build`; paskutinio patikrinimo rezultatą žr. projekto darbo suvestinėje.

## Supabase sauga

`supabase/schema.sql` įjungia RLS `trips` ir `activities` lentelėms. Kelionės politikos tikrina `auth.uid() = user_id`; veiklų politikos patikrina, ar jų `trip_id` priklauso prisijungusio vartotojo kelionei. Kliento užklausose taip pat filtruojama pagal savininką, tačiau tikrą prieigos ribą užtikrina Supabase RLS. Lentelės ir politikos turi būti patikrintos ir Supabase projekte, nes vietinis SQL failas neįrodo, kokia schema šiuo metu įdiegta nuotolinėje duomenų bazėje.

## Rankinis patikrinimas

1. Užregistruokite vartotoją ir, jei įjungtas el. pašto patvirtinimas, patvirtinkite el. paštą. Prisijunkite, atnaujinkite puslapį ir patikrinkite, kad sesija išlieka.
2. Atsijunkite ir tiesiogiai atverkite `/`, `/trips/new` arba `/trips/<id>` – turi būti nukreipta į prisijungimą. Prisijungus turi būti grąžinta į prašytą puslapį.
3. Sukurkite kelionę, patikrinkite Dashboard, jos detales, redagavimą ir ištrynimą. Patikrinkite privalomus laukus bei neteisingą datų intervalą.
4. Kelionės dienotvarkėje sukurkite veiklą, pakeiskite jos laukus ir datą kelionės ribose, tada ją ištrinkite. Patikrinkite, kad veikla yra teisingoje dienoje, o `activity_time` rodomas be laiko juostos konvertavimo.
5. Patikrinkite tuščias keliones ir dienotvarkes, `Try again` veiksmą esant tinklo klaidai, bei nepasiekiamą arba kito vartotojo kelionės ID.
6. Su antru vartotoju patikrinkite, kad pirmojo vartotojo kelionės ir veiklos nėra matomos, o kito vartotojo kelionės URL neatskleidžia įrašo.
