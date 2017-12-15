% -*- Prolog -*-
% @copyright ©2017, Rodrigo Cacilhας <batalema@cacilhas.info>
:- [parser, library(main)].

main([Filename]) :- parse(Filename).
main([]) :- current_prolog_flag(os_argv, [_, '-x', Path | _]),
            file_base_name(Path, Script),
            format('use: ~w <source>~n', [Script]).

%:- initialization(main).
% vim:set et:filetype=prolog
