/**
 * Supabase client com a chave de serviço do backend
 *
 * Este cliente tem permissões elevadas e bypass das políticas RLS,
 * deve ser usado apenas no servidor backend e nunca exposto para o frontend.
 */
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
export default supabase;
//# sourceMappingURL=supabase.d.ts.map