================================================================================
PROJEKT INTEGRACJI SYSTEMÓW: "Smart City Integrator"
System Analizy Jakości Życia i Dostępności Mieszkań w Miastach
================================================================================

1. INFORMACJE O ZESPOLE I PODZIAŁ PRAC
--------------------------------------------------------------------------------
Zespół projektowy:

-> Roman Rybak (Nr albumu: 101752)
   Zadania: 
   - Architektura backendu (Node.js/Express)
   - Implementacja i konfiguracja bazy danych SQLite z ORM Sequelize.
   - Realizacja wymagań niefunkcjonalnych: konfiguracja poziomów izolacji 
     i współbieżności bazy (tryb WAL, busy_timeout).
   - Opracowanie mechanizmu transakcji (ACID) dla zapisu danych (commit/rollback).
   - Implementacja uwierzytelniania i autoryzacji JWT (logowanie, walidacja bcrypt).
   - Konteneryzacja całego systemu przy użyciu Docker i Docker Compose.
   - Integracja z zewnętrznymi usługami REST API (NBP, Open-Meteo) z mechanizmem 
     cache'owania oraz obsługą limitów zapytań (Rate Limiting).

-> Oleksandr Pyrlyk (Nr albumu: 101751)
   Zadania:
   - Integracja danych historycznych (wczytywanie i parsowanie plików CSV z GUS).
   - Budowa warstwy graficznej (React.js): implementacja responsywnego interfejsu (SPA).
   - Wizualizacja danych: generowanie interaktywnych wykresów (Recharts) oraz 
     dynamicznej mapy Polski (Leaflet/CSS).
   - Mechanizm eksportu zintegrowanych raportów do formatu XML.

*Prace nad logiką wyliczania autorskiego Wskaźnika Jakości Życia były prowadzone wspólnie.*


2. CEL PROJEKTU I ROZWIĄZYWANY PROBLEM
--------------------------------------------------------------------------------
Zgodnie z definicją, projekt stanowi odpowiedź na problem rozproszenia i 
niejednoznaczności formatów danych miejskich i rynkowych:
- Przestarzałe i trudne w analizie pliki płaskie (CSV z zasobów GUS).
- Dynamiczne, zmienne w czasie dane walutowe (REST API NBP).
- Surowe dane meteorologiczne i ekologiczne w czasie rzeczywistym (REST API Open-Meteo).

Cel: Konsolidacja i normalizacja tych heterogenicznych zasobów w jednym systemie 
w celu stworzenia aktualnego zestawu danych. Wynikiem integracji jest generowanie 
korelacji (raportów) wskazujących opłacalność zakupu mieszkań oraz wskaźnik 
jakości życia (łączący finanse, przestępczość, pogodę i czystość powietrza PM2.5/PM10).


3. POKRYCIE WYMAGAŃ PROJEKTOWYCH (Checklist dla prowadzącego)
--------------------------------------------------------------------------------
WYMAGANIA FUNKCJONALNE:
[X] Obsługa REST: Pobieranie kursu EUR (NBP) oraz pogody/jakości powietrza (Open-Meteo).
[X] Eksport danych: Możliwość pobrania wygenerowanego raportu w formacie XML (warstwa widoku).
[X] Baza danych i ORM: Odczyt i zapis raportów do relacyjnej bazy SQLite za pomocą Sequelize ORM. Profile w MongoDB.
[X] Uwierzytelnienie i autoryzacja: Mechanizm logowania oparty na tokenach JWT oraz hashowaniu haseł (bcrypt).
[X] Transakcje: Zapis zintegrowanych wyników do bazy realizowany jest w bezpiecznej transakcji (sequelize.transaction) z obsługą rollback przy błędach.

WYMAGANIA NIEFUNKCJONALNE:
[X] Warstwa graficzna: Rozbudowany interfejs (React) z kartami, wykresami (Bar/Area/Line) oraz mapą.
[X] Dostęp do współdzielonych zasobów (Izolacja): Wdrożono komendy `PRAGMA journal_mode = WAL` (Write-Ahead Logging) oraz `busy_timeout = 5000` na silniku SQLite dla obsługi równoczesnego odczytu i zapisu.
[X] Kontener Docker: System działa w środowisku wielokontenerowym (Frontend + Backend + Baza NoSQL) spiętym przez docker-compose.


4. INSTRUKCJA URUCHOMIENIA KODU W ŚRODOWISKU (DOCKER)
--------------------------------------------------------------------------------
Aplikacja została w pełni skonteneryzowana. Nie wymaga instalacji lokalnego serwera 
Node.js ani konfiguracji baz danych w systemie hosta lub środowisku IDE.

Wymagania systemowe:
- Docker Engine oraz Docker Compose
- W systemie Windows zalecony jest działający podsystem WSL2.

Kroki uruchomienia:
1. Wypakuj archiwum z projektem do wybranego folderu.
2. Otwórz terminal (wiersz poleceń / PowerShell / bash) w głównym folderze projektu 
   (tam, gdzie znajduje się plik docker-compose.yml).
3. Uruchom polecenie budujące i startujące kontenery:
   
   docker-compose up --build

4. Poczekaj na pobranie obrazów i uruchomienie serwisów (proces może potrwać 1-2 minuty 
   przy pierwszym uruchomieniu).
5. Aplikacja kliencka (Warstwa Graficzna) będzie dostępna w przeglądarce pod adresem:
   
   http://localhost:8080

Wskazówki testowe:
- Należy w pierwszej kolejności zarejestrować nowego użytkownika (np. test@test.pl).
- Po zalogowaniu należy użyć przycisku "Uruchom analizę", aby wyzwolić proces ETL 
  (pobranie z REST, odczyt z CSV, przeliczenie, transakcja ORM).
- Po zakończeniu analizy można przełączać widoki oraz wyeksportować dane do XML.