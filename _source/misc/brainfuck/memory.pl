% -*- Prolog -*-
% @copyright ©2017, Rodrigo Cacilhας <batalema@cacilhas.info>
:- module(memory, [get_slot/2, set_slot/2, incr_slot/1, decr_slot/1,
                   next_slot/1, prev_slot/1]).
:- [utils].
:- dynamic slot/3, pos/2.

%-------------------------------------------------------------------------------
% API
%
get_slot(Name, Value) :- get_pos(Name, Pos),
                         get_slot(Name, Pos, Value).

set_slot(Name, Value) :- get_pos(Name, Pos),
                         set_slot(Name, Pos, Value).

incr_slot(Name) :- get_slot(Name, Value),
                   succ(Value, NewValue),
                   set_slot(Name, NewValue).

decr_slot(Name) :- get_slot(Name, Value),
                   succ(NewValue, Value),
                   set_slot(Name, NewValue).

next_slot(Name) :- get_pos(Name, Pos),
                   succ(Pos, NewPos),
                   set_pos(Name, NewPos).

prev_slot(Name) :- get_pos(Name, Pos),
                   succ(NewPos, Pos),
                   set_pos(Name, NewPos).


%-------------------------------------------------------------------------------
% Internals
%
get_pos(Name, Pos) :- pos(Name, Pos), !.
get_pos(_, 0).

set_pos(Name, Pos) :- optional(retract(pos(Name, _))),
                      assertz(pos(Name, Pos)).

get_slot(Name, Pos, Value) :- slot(Name, Pos, Value), !.
get_slot(Name, Pos, 0)     :- \+ slot(Name, Pos, _).

get_slot_check_zero(Name, Pos) :- slot(Name, Pos, _), !,
                                  slot(Name, Pos, 0).
get_slot_check_zero(_, _).

set_slot(Name, Pos, Value) :- optional(retract(slot(Name, Pos, _))),
                              assertz(slot(Name, Pos, Value)).

reset(Name) :- optional(retract(pos(Name, _))),
               optional(retract(slot(Name, _, _))).


%-------------------------------------------------------------------------------
% Test
%
:- begin_tests(memory, [cleanup(reset(test))]).

test(get_slot) :- assertion(get_slot(test, 0)), % non free variable
                  assertion((                   % free variable
                    get_slot(test, Value),
                    Value = 0
                  )).

test(set_slot) :- set_slot(test, 5),
                  assertion(get_slot(test, 5)), % non free variable
                  assertion((                   % free variable
                    get_slot(test, Value),
                    Value = 5
                  )),
                  assertion(\+ get_slot(test, 0)).

test(incr_slot) :- incr_slot(test),
                   get_slot(test, 6).

test(decr_slot) :- decr_slot(test),
                   get_slot(test, 5).

test(next_slot) :- next_slot(test),
                   incr_slot(test),
                   get_slot(test, 1).

test(prev_slot) :- prev_slot(test),
                   get_slot(test, 5).

test(other_slot, [cleanup(reset(test2))]) :- assertion(get_slot(test2, 0)),
                                             incr_slot(test2),
                                             assertion(get_slot(test2, 1)),
                                             assertion(get_slot(test, 5)).


:- end_tests(memory).

% vim:set et:filetype=prolog
