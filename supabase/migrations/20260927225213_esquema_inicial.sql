-- Esquema inicial de Go Gym: cada usuario (auth.users) ve y edita solo sus datos.
--
-- Las listas que la app siempre lee y guarda completas (ejercicios de una rutina,
-- ejercicios y series de un entrenamiento, comidas y actividades de un día) van en
-- jsonb, con la misma forma que los modelos de GG/src/app/models.
--
-- Los ids de rutinas y sesiones los genera la app y son únicos por usuario, por eso
-- la clave primaria es (user_id, id). perfiles.rutina_favorita_id y sesiones.rutina_id
-- son referencias blandas: el historial conserva el id aunque la rutina se borre.

create extension if not exists moddatetime schema extensions;

-- ------------------------------------------------------------------ perfiles

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  apellido text not null default '',
  objetivo text not null default '',
  rutina_favorita_id bigint,
  peso_kg numeric(5, 1) not null default 75 check (peso_kg > 0),
  dias_entrenamiento smallint[] not null default '{0,2,4}'
    check (dias_entrenamiento <@ '{0,1,2,3,4,5,6}'::smallint[]),
  hora_entrenamiento time not null default '18:00',
  meta_calorias integer not null default 2200 check (meta_calorias >= 0),
  meta_proteina integer not null default 150 check (meta_proteina >= 0),
  meta_carbohidratos integer not null default 260 check (meta_carbohidratos >= 0),
  meta_grasas integer not null default 70 check (meta_grasas >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Datos del usuario: nombre, peso, días de entrenamiento y metas.';

-- ------------------------------------------------------------------- rutinas

create table public.rutinas (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id bigint not null,
  nombre text not null,
  categoria text not null default '',
  nivel text not null default '',
  minutos integer not null default 0 check (minutos >= 0),
  ejercicios jsonb not null default '[]' check (jsonb_typeof(ejercicios) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

comment on table public.rutinas is 'Rutinas del usuario. ejercicios: Ejercicio[] en orden.';

-- ------------------------------------------------------------------ sesiones

create table public.sesiones (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id bigint not null,
  nombre text not null,
  rutina_id bigint,
  inicio timestamptz not null,
  fin timestamptz check (fin is null or fin >= inicio),
  ejercicios jsonb not null default '[]' check (jsonb_typeof(ejercicios) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

comment on table public.sesiones is 'Entrenamientos terminados. ejercicios: EjercicioSesion[] con sus series.';

-- La app lee el historial del más reciente al más antiguo.
create index sesiones_user_id_inicio_idx on public.sesiones (user_id, inicio desc);

-- -------------------------------------------------------- registros_calorias

create table public.registros_calorias (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  comidas jsonb not null default '[]' check (jsonb_typeof(comidas) = 'array'),
  actividades jsonb not null default '[]' check (jsonb_typeof(actividades) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (user_id, fecha)
);

comment on table public.registros_calorias is 'Comidas y actividades de cada día.';

-- ---------------------------------------------------------------- updated_at

create trigger perfiles_updated_at before update on public.perfiles
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger rutinas_updated_at before update on public.rutinas
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger registros_calorias_updated_at before update on public.registros_calorias
  for each row execute procedure extensions.moddatetime(updated_at);

-- ------------------------------------------------------------ acceso (Data API)

-- Solo usuarios con sesión. Se da permiso explícito en vez de depender de los
-- permisos por defecto del esquema public.
revoke all on table public.perfiles, public.rutinas, public.sesiones, public.registros_calorias
  from anon;
grant select, insert, update, delete
  on table public.perfiles, public.rutinas, public.sesiones, public.registros_calorias
  to authenticated;

alter table public.perfiles enable row level security;
alter table public.rutinas enable row level security;
alter table public.sesiones enable row level security;
alter table public.registros_calorias enable row level security;

-- (select auth.uid()) se evalúa una vez por consulta y no una vez por fila.

create policy "perfiles: ver el propio" on public.perfiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfiles: crear el propio" on public.perfiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfiles: editar el propio" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "rutinas: ver las propias" on public.rutinas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "rutinas: crear las propias" on public.rutinas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "rutinas: editar las propias" on public.rutinas
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rutinas: borrar las propias" on public.rutinas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "sesiones: ver las propias" on public.sesiones
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sesiones: crear las propias" on public.sesiones
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sesiones: editar las propias" on public.sesiones
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sesiones: borrar las propias" on public.sesiones
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "registros_calorias: ver los propios" on public.registros_calorias
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "registros_calorias: crear los propios" on public.registros_calorias
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "registros_calorias: editar los propios" on public.registros_calorias
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "registros_calorias: borrar los propios" on public.registros_calorias
  for delete to authenticated using ((select auth.uid()) = user_id);
