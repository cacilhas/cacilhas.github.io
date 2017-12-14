% -*- Prolog -*-
% @copyright ©2017, Rodrigo Cacilhας <batalema@cacilhas.info>
:- module(utils, [finally/2, optional/1]).
:- meta_predicate optional(0), finally(1, +).
:- dynamic side_effect/0.  % for tests purposes

optional(Goal) :- Goal *-> true; true.

finally( Goal, Final) :- Goal, !, optional(Final).
finally(_Goal, Final) :- optional(Final), fail.


%-------------------------------------------------------------------------------
:- begin_tests(utils).

test('optional/true') :- optional(true).
test('optional/fail') :- optional(fail).

test('finally/true/true') :- finally(true, true).
test('finally/true/fail') :- finally(true, fail).
test('finally/fail/true') :- \+ side_effect,
                             assertion(\+ finally(fail, asserta(side_effect))),
                             side_effect.
test('finally/fail/fail', [fail]) :- finally(fail, fail).

:- end_tests(utils).

% vim:set et:filetype=prolog
