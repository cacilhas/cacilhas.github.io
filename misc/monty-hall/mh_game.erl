%%%=============================================================================
%%% @author ℜodrigo Arĥimedeς ℳontegasppα ℭacilhας <batalema@cacilhas.info>
%%%         [http://cacilhas.info/kodumaro/]
%%% @copyright ©2016, ℜodrigo ℭacilhας
%%% @doc
%%%
%%% @end
%%%=============================================================================
-module(mh_game).
-author('batalema@cacilhas.info').
-export([play/0, play/1]).

-define(ROUNDS, 1000).

-spec play() -> integer().
-spec play(Rounds :: integer()) -> integer().


%===============================================================================
play() -> play(?ROUNDS).


play(Rounds) ->
    mh_mc:start_link(),
  	case catch play(Rounds, 0) of Response -> Response end,
    mh_mc:stop(),
    Response.


play(0, Acc) -> Acc;

play(Rounds, Acc) when Rounds > 0 ->
    FirstChoice = mh_guest:choose(),
    {ok, Other} = mh_mc:suggest_another_door(FirstChoice),
    Door = mh_guest:change(FirstChoice, Other),
    case mh_mc:get_prize(Door) of
        {ok, goat} -> play(Rounds - 1, Acc);
        {ok, car} -> play(Rounds - 1, Acc + 1);
        Other -> throw(Other)
    end.
