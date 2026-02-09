\set pguser `echo "$POSTGRES_USER"`

create database _supabase;
alter database _supabase owner to :pguser;
