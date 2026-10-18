-- Riftzada — região no perfil (cidade + UF)
-- Ajuda quem quer trocar ou vender a saber de onde a pessoa é. As duas são opcionais;
-- a cidade só vale junto com a UF. Leitura e edição seguem as policies de profiles.

alter table public.profiles
  add column city text check (char_length(city) between 2 and 60),
  add column state text check (state in (
    'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
    'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
  )),
  add constraint profiles_city_needs_state check (city is null or state is not null);
