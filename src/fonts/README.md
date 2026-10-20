Barlow e Barlow Condensed são distribuídas sob a SIL Open Font License 1.1.
Arquivos obtidos de `google/fonts` na revisão `47d54ca1ebb14fd864695f1d39dc734f39017c33`.
As licenças estão em `OFL-Barlow.txt` e `OFL-BarlowCondensed.txt`.

As fontes ficam no projeto para que desenvolvimento e build funcionem sem buscar Google Fonts pela rede.

Cinzel Variable (títulos cerimoniais da coleção) também usa SIL Open Font License 1.1.
Foi obtida de `google/fonts` (`ofl/cinzel`) em 18/10/2026; licença em `OFL-Cinzel.txt`.

Os arquivos estão em WOFF2 com subconjunto latino (português, espanhol, pontuação, setas e €), gerados dos TTF originais com `fonttools` para reduzir o peso:

```bash
pyftsubset Fonte.ttf --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303,U+0327,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF" --layout-features='*' --flavor=woff2
```

Caractere fora dessa faixa cai na fonte do sistema. Para trocar ou acrescentar um peso, baixe o TTF da mesma revisão e rode o comando acima.
