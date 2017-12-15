% -*- Prolog -*-
% @copyright ©2017, Rodrigo Cacilhας <batalema@cacilhas.info>
:- module(tape, [create_tape/2, read_tape/2, tape_backward/1, end_of_tape/1,
          start_of_tape/1]).

create_tape(Filename, Tape) :-
    open(Filename, read, Tape,
         [buffer(false), lock(read), wait(false)]).

read_tape(Tape, Res) :- get_char(Tape, Res).

tape_backward(Tape) :- tape_backward(Tape, 2).

tape_backward(Tape, Steps) :- BackwardSteps is -1 * Steps,
                              tape_forward(Tape, BackwardSteps).

tape_forward(Tape, Steps) :- seek(Tape, Steps, current, _).

end_of_tape(Tape) :- at_end_of_stream(Tape).

start_of_tape(Tape) :- seek(Tape, 0, current, 0).


%-------------------------------------------------------------------------------
:- begin_tests(tape).

test(create_tape, [setup(create_tape('test.tape', Tape)),
                   cleanup(close(Tape)) ]) :-
    start_of_tape(Tape),
    read_tape(Tape, '1'),
    \+ start_of_tape(Tape),
    read_tape(Tape, '2').

test(read_tape, [setup(create_tape('test.tape', Tape)),
                 cleanup(close(Tape)) ]) :-
    start_of_tape(Tape),
    forall(
        member(X, [49, 50, 51, 52, 53, 10]),
        (
            read_tape(Tape, R),
            char_code(R, X)
        )
    ),
    end_of_tape(Tape).

test(tape_backward, [setup(create_tape('test.tape', Tape)),
                     cleanup(close(Tape))]) :-
    start_of_tape(Tape),
    tape_forward(Tape, 3),
    tape_backward(Tape, 1),
    read_tape(Tape, '3').

:- end_tests(tape).

% vim:set et:filetype=prolog
