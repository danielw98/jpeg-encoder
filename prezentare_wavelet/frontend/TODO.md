- [x] sagetile de navigare intre pagini mai centrate
- [x] bara din stanga sa poata fi ascunsa, sa nu ocupe spatiu
- [x] cand am o animatie, sa fie cat mai in centrul atentiei, nimic intre butoane si animatie. eventual butoanele sub animatie ca si controale.
- [x] partea de jos a paginii se randeaza in gol, cumva am viewport partial de sus in jos.
- [x] la butoane cand dau click sa fie centrat ok text-ul.
- [x] playground: cand rulez animatia si apas stop, sa ramana asa dar cand rulez alta animatie sa fie centrata cu param default. cumva mai responsive, nu stiu sa descriu.
- [x] toate paginile au probleme cu dimensiunea componentelor, nu e pana jos de tot si ramane gol, trebuie sa dau scroll inauntru.

- [x] wavelets fundamentale psi randat cu latex, mate randat cu latex
- [x] a si b la animatii mai clari
- [x] sa se deseneze si axa de simetrie la functia originala
- [x] valabil pentru graficul de pe pagina anterioara de asemenea

- [x] pagina de introducere nu se mai randeaza.
- [x] pagina 2 fourier controalele sub grafic, si detaliile separate de controale si grafic


- [x] browsing-ul imbinat cu sectiunile pe modul tour (sa nu ne mai duca pe pagina, sa randeze bucata aia in tour)
- [x] lasat tour-ul manual separat
- [x] totul dinamic, se modifica ceva in tour manual, se vede si in tour automat
- [x] tour-ul sa flow-uiasca precum o prezentare ppt
- [x] de lamurit la semnalele filtrate in banda original vs filtrat grafice - nu se vede decat un grafic, uneori pare aproape zero semnalul filtrat, si de sincronizat cu filtrele de banda. ar avea sens si o reprez in frecventa sa vizualizez taierea anumitor frecvente?
- [] later: de facut complet sectiunea cu imagini, nici nu am testat-o.
- [x] reprezentare cu integrale, arii negative si pozitive rosu si verde, medie, magintudine pozitiva finita, etc.
- [x] wavelet overlapped pe semnal si rezultatul vizual + slider (https://www.youtube.com/watch?v=jnxqHcObNK4 21:34) - convolutie explicita unda initiala si wavelet-ul, si jos unda rezultata (pe fundal functia la care se aplica wavelet-ul)
- [] tradeoff timp frecventa (momentum vs position) - heisenberg boxes
- [] wavelet pt partea real+imag si suprafata si argumentare de ce wavelet peste fourier
- [] pentru imagini sa se vada un box, coeficientii, cum arata in frecventa (exemplu: https://medium.com/@pasanSK/jpeg-compression-step-by-step-8d84598190c#:~:text=Fig.%203%20%E2%80%94%20Discrete%20Cosine%20Transform%20example%20%5B4%5D)
- [] reparata partea cu SNR pare cam naspa momentan
- [x] sa nu fie globala in nav in intregul site selectia imaginii, sa fie locala paginii care are nevoie de imagine
- [] algoritmul Mallat explicit pe o imagine, pas cu pas.
- [] alte aplicatii ale wavelets explicate pe larg
- [] spectograma, alte chestii mai impresionante vizual relevante intelegerii
- [x] kernels aplicate pe imagini, demonstratie si slider (blur, edge detection, etc)
- [x] paginat mai bine, demo slide la tur paginat


- [x] cand apas incepe prezentarea, este ca si cum apas start guide. nu ar trebui sa am buton de incepe prezentarea in timp ce sunt in ghid.
- [] continutul fiecarei pagini cat mai bine sa incapa pe verticala, pot folosi stanga/dreapta spatiu pentru meniu, navigatie
- [partial] paginile mai lungi paginate in subsectiuni, teorie, demo interactiv, concluzii/interpretare, raman precum sunt structurate momentan ca text, sa ocupe intregul ecran
- [x] kernel-urile sa afiseze valorile cu fractii nu 0.3333
- [x] sa dispara dropdown-ul de test image de pe pagina principala sa fie doar pe pagina/paginile cu imagini

INCA DE REPARAT:
- [x] pe pagina cu filtre de banda, semnalul concret si semnalul filtrat, sa apara pe acelasi grafic, culori diferite, sa se observe diferenta.
- [x] butoane mai ok ca valori pentru ce avem acolo (sa nu filtreze frecv intre 100hz si 500hz cand noi avem intre 4 si 70hz spre exemplu, e doar un exemplu)
- [x] frecventele in Hz nenormalizate
- [] buton de reset la default cand modific din slidere? (pe ce pagina/pagini?)
- [partial] timp/frecventa grafice anotatiile sa fie scalabile si pozitionate corect
- [x] graficele la comun la filtre in domeniul frecventei, si as vrea sa nu misc de slider pana la stanga de tot pentru a observa diferente in grafic, mai bine ajustate capetele pt filtrare
- [x] la slide-ul cu convolutia as vrea teoria separat, slider si kernel si grafic si animatie impreuna, convolutia 2d pe slide separat
- [] de implem scalograma
- [partial] tool-uri pentru vizualizarea graficelor si selectare parametri mai intuitive, sa incapa in viewport-ul paginii, eventual meniu colapsabil.
- [?] 8/33 de vazut daca celelalte filtre sunt aplicate corect la comparative original/filtrat

==================NEW TODO's================
GENERAL:

===CSS===
- [] css separat si mai mult in fisiere
- []variabilele de culoare centralizate
- [] toate paginile sa aiba un stil comun cu mici ajustari, dar nu fisiere css redundante per pagina
- [] sters cod legacy
===COD REACT + JS===
- [] impartire pe componente mai clara si subcomponente. facut mai scalabil, in stilul react, modificari minime si cat mai localizate, modular.

===STRUCTURA PROIECTULUI===
- [] mult mai clara, mai umana, nu cod scris de masina duplicat copy paste cu modificari minimale, mai centralizat totul, preecum intr-un repo care ar lucra cu acest tech stack. To add more context: spre exemplu graficul sa fie scalabil, in browser, interactibil, mutabil, precum desmos. un component separat care se ocupa de grafice sau un engine sau o librarie, alege

SLIDES:
## Sectiunea introducere + cuprins prezentare
[1] -> OK
[2] -> OK
## Sectiunea Transformata Fourier
[3] -> OK (poate de adaugat poza cu fourier, sau un personaj deseneat si obiecte desenate, cu sens contextual spre FT) (LOW PRIO)
[4] 
[x] -> mai multe detalii matematice despre transf fourier. pastrat continutul actual, doar adaugat lucruri in plus (DONE - added inverse Fourier, Euler's formula, Parseval's theorem)
[5]
[x] -> de adaugat titlu/sectiune header, precum in alte slide-uri, descriptiva
[x] -> precum in slide11 randat graficul
[?] -> un punct centralizat in cod pentru ca fiecare randare de grafic face cam aceleasi lucruri
[x] -> scalare functii preset siderbar (DONE - bigger buttons, better styling)
[x] -> add phase spectrum visualization (DONE - toggle between |F| and ∠F)

[8] band pass filter + convolutie pt a extrage frecventele
[11] animatie pentru grafic sliding window la convolutie? precum la convolutia 2d cu pixelii
[12]
- [] content-urile slide-ului actualizate, scoase matricile (sunt in slide-urile urmatoare), mai clara convolutia la wavelets dpdv matematic
SLIDE IMPROVEMENTS/NEW IDEAS:
[20] - Wavelet Playground (DONE)
- ψ(t) rendering fixed
- t=0 green label repositioned to bottom axis
- Collapsible sidebar with wavelet types, parameters, animation controls
- Reset button in animation row
- [TODO] animatie si pt frecventa

[21] - Wavelet Scan Demo (NEW)
- Scanarea unui semnal cu un wavelet
- Arii pozitive (verde) și negative (roșu) vizualizate
- Grafic sus: semnal f(t) + wavelet ψ(t-b) suprapuse
- Grafic jos: coeficientul W(b) rezultat din integrală
- Semnale: Sinusoidă, Chirp, Puls, Treaptă
- Wavelets: Morlet, Mexican Hat, Haar
- Animație "Scanează" care mută wavelet-ul de-a lungul semnalului
- [TODO] extensie la wavelets complexe si plot suprafata + Heisenberg boxes


[28] - Ilustratie cu algoritmul lui Mallat
- de facut mai intuitiva
- ce face mai exact, explicat mai clar

NEW SLIDES:


SITE IN GENERAL:
- sa se poata accesa individual sectiunile si in modul non-prezentare, ca mini articole si subsectiuni, merge-uind slide-urile sectiunii in pagina de output
- nume endpoint-uri mai sugestive cand cer pagini de la server
- intregul proiect layout responsive, tinand cont de structura paginii randate, cat mai logic mapat pe dispozitive mobile.
- guided tour god class/component - split-uit .css si componenta in componenta parinte si componente copil randate. (sa poata fi reutilizat layout-ul pentru alte prezentari)
- move theory demo into th wavelets chapter at the beginning before the graphs
- nume pe site mai ok ex NU "kernels edu", si exprimari mai ok


- NEAPARAT logica in api in backend nu in frontend, cat mai putina logica in frontend. de facut fisirer cu fisier de creat api endpoints de centralizat logica comuna.

- slide 3 butterworth cutoff frequency ajustare ccat de abrupt

=====
#fourier-demo 5/39: functii preset mai mare scrisul/sa se ascunda si sa apara
#conv-2d 12/39: mai mare scrisul, sa ocupe toata pagina slide-ul
#kernels-explanation 15/39: titlu, matrici mai centrate

---https://medium.com/@pasanSK/jpeg-compression-step-by-step-8d84598190c - de adaugat DCT si frecvente precum aici, si pasii transformatei.


MINOR FIXES:
slide 16 kernels edu - speed bar either with percentage or nothing, not ms. consistent like others.
----!!! make backend do backend job, make frontend do frontend job.
- cleaner API, sectioned, everything computation-wise on backend, just return the files.
- cleaner react components/reusable
- cleaner css/reusable


SLIDE 29 decomp-demo - css hover pe LL/LH etc, imagine completa de implementat corect.
SLIDE 29 decomp demo nu se intelege nimic in stadiul actual, imaginea nu merge in dreapta cum as dori
SLIDE 39 - dc denoised arata ca un cacat? are rost slide-ul?
- de zis mai multe despre aplicatiile wavelets in domeniul medical si alte domenii, de dezvoltat.
- slide-ul 3d de scos sau de facut mai clar