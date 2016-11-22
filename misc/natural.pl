% -*- Prolog -*-
:- module(natural, [nat/1, even/1, odd/1]).

nat(z).
nat(s(N)) :- nat(N).

to_int(N, R) :- nat(N), to_int(N, 0, R).
to_int(z, A, A).
to_int(s(N)) --> succ, to_int(N).

from_int(I, R) :- integer(I), I >= 0, from_int(I, z, R).
from_int(0, A, A).
from_int(I) --> { I1 is I - 1 }, nsucc, from_int(I1).
nsucc(N, s(N)) :- nat(N).

even(z).
even(s(N)) :- odd(N).
odd(N) :- \+ even(N).


%------------------------------------------------------------------------
go :- current_prolog_flag(argv, [X]),
      atom_to_term(X, I, []),
      from_int(I, N),
      writeln(N), !.
go :- current_prolog_flag(os_argv, [_, '-x', Path | _]),
      file_base_name(Path, Script),
      format('use: ~w <zero_or_positive_value>~n', [Script]).


%------------------------------------------------------------------------
:- begin_tests(natural).

test(nat,
     [forall(member(N, [z,
                        s(z),
                        s(s(z)),
                        s(s(s(z))),
                        s(s(s(s(z)))),
                        s(s(s(s(s(z)))))]))]) :- nat(N).

test(to_int,
     [forall(member([I, N],
                    [[0, z],
                     [1, s(z)],
                     [2, s(s(z))],
                     [3, s(s(s(z)))],
                     [4, s(s(s(s(z))))],
                     [5, s(s(s(s(s(z)))))]]))]) :- to_int(N, I).

test(from_int,
     [forall(member([I, N],
                    [[0, z],
                     [1, s(z)],
                     [2, s(s(z))],
                     [3, s(s(s(z)))],
                     [4, s(s(s(s(z))))],
                     [5, s(s(s(s(s(z)))))]]))]) :- from_int(I, N).

test(even,
     [forall(member(N, [z,
                        s(s(z)),
                        s(s(s(s(z))))]))]) :- even(N).

test(not_even,
     [forall(member(N, [s(z),
                        s(s(s(z))),
                        s(s(s(s(s(z)))))])), fail]) :- even(N).

test(odd,
     [forall(member(N, [s(z),
                        s(s(s(z))),
                        s(s(s(s(s(z)))))]))]) :- odd(N).

test(not_odd,
     [forall(member(N, [z,
                        s(s(z)),
                        s(s(s(s(z))))])), fail]) :- odd(N).

test(failure_from_int, [fail]) :- from_int(-1, _).
test(no_nat, [fail]) :- nat(z(s)).

:- end_tests(natural).

% vim:set filetype=prolog
