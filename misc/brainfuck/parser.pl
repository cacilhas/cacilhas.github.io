% -*- Prolog -*-
% @copyright ©2017, Rodrigo Cacilhας <batalema@cacilhas.info>
:- module(parser, [parse/1]).
:- [tape, memory,  utils].

%-------------------------------------------------------------------------------
% API
%
parse(Filename) :- create_tape(Filename, Tape),
                   finally(parse_tape(Tape),
                           close(Tape)).


%-------------------------------------------------------------------------------
% Parse commands
%
perform(_, >) :- !, next_slot(brainfuck).

perform(_, <) :- !, prev_slot(brainfuck).

perform(_, +) :- !, incr_slot(brainfuck).

perform(_, -) :- !, decr_slot(brainfuck).

perform(_, .) :- !, get_slot(brainfuck, Value),
                 char_code(Show, Value),
                 write(Show),
                 flush_output.

perform(_, ',') :- !, get_char(Value),
                   process_read(Value).

perform(Tape, '[') :- get_slot(brainfuck, 0), !,
                      goto_close(Tape, 1).

perform(_, '[') :- !.

perform(_, ']') :- get_slot(brainfuck, 0), !.

perform(Tape, ']') :- !, goto_open(Tape, 1).

perform(_, _). % ignore unknown characters


%-------------------------------------------------------------------------------
% Internals
%
parse_tape(Tape) :- end_of_tape(Tape), !.

parse_tape(Tape) :- read_tape(Tape, Statement),
                    perform(Tape, Statement),
                    parse_tape(Tape).

process_read(end_of_file) :- !, set_slot(brainfuck, 0). % use NULL as EOF
process_read(Value) :- char_code(Value, Num),
                       set_slot(brainfuck, Num).

goto_close(_, 0) :- !.

goto_close(Tape, _) :- end_of_tape(Tape), !.

goto_close(Tape, N) :- read_tape(Tape, Value),
                       check_close(Tape, N, Value).

check_close(Tape, N, '[') :- !, succ(N, N1),
                             goto_close(Tape, N1).

check_close(Tape, N, ']') :- !, succ(N1, N),
                             goto_close(Tape, N1).

check_close(Tape, N, _) :- goto_close(Tape, N).

goto_open(_, 0) :- !.

goto_open(Tape, _) :- start_of_tape(Tape), !.

goto_open(Tape, N) :- tape_backward(Tape),
                      read_tape(Tape, Value),
                      check_open(Tape, N, Value).

check_open(Tape, N, '[') :- !, succ(N1, N),
                            goto_open(Tape, N1).

check_open(Tape, N, ']') :- !, succ(N, N1),
                            goto_open(Tape, N1).

check_open(Tape, N, _) :- goto_open(Tape, N).

% vim:set et:filetype=prolog
