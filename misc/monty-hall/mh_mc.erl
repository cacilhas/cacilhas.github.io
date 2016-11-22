%%%=============================================================================
%%% @author ℜodrigo Arĥimedeς ℳontegasppα ℭacilhας <batalema@cacilhas.info>
%%%         [http://cacilhas.info/kodumaro/]
%%% @copyright ©2016, ℜodrigo ℭacilhας
%%% @end
%%%=============================================================================
-module(mh_mc).
-author('batalema@cacilhas.info').
-behavior(gen_server).

-export([start_link/0, stop/0, get_prize/1, suggest_another_door/1]).
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2,
         code_change/3]).

-include("mh.hrl").

-spec start_link() -> {ok, Pid} when Pid :: pid().
-spec stop() -> ok.
-spec get_prize(Door :: door()) -> {ok, Prize} when Prize :: prize() | {error, _}.
-spec suggest_another_door(Door :: door()) -> {ok, OtherDoor} when OtherDoor :: door() | {error, _}.


%%%=============================================================================
%%% API
%%%

start_link() ->
    gen_server:start_link({local, ?MODULE}, ?MODULE, null, []).


stop() ->
    gen_server:cast(?MODULE, stop).


get_prize(Door) ->
    case gen_server:call(?MODULE, {door, Door}) of
        {prize, Prize} -> {ok, Prize};
        Other -> {error, Other}
    end.


suggest_another_door(Door) ->
    case gen_server:call(?MODULE, {other, Door}) of
        null -> {error, null};
        OtherDoor -> {ok, OtherDoor}
    end.

%%%=====================================================================
%%% Behavior
%%%

init(null) ->
    random:seed(now()),
    Doors = [{a, goat}, {b, goat}, {c, goat}],
    CarDoor = lists:nth(random:uniform(3), [a, b, c]),
    {ok, lists:keyreplace(CarDoor, 1, Doors, {CarDoor, car})}.


terminate(_Reason, _State) -> ok.


handle_cast(stop, State) -> {stop, normal, State};
handle_cast(_Request, State) -> {noreply, State}.


handle_call({door, Door}, _From, State) ->
    case lists:keyfind(Door, 1, State) of
        {_, Prize} -> {reply, {prize, Prize}, State};
        false -> {reply, null, State}
    end;

handle_call({other, Door}, _From, State) ->
    case lists:keyfind(Door, 1, State) of
        {_, goat} ->
            {OtherDoor, _} = lists:keyfind(car, 2,
                                           lists:keydelete(Door, 1, State));
        {_, car} ->
            {OtherDoor, _} = lists:nth(random:uniform(2),
                                       lists:keydelete(Door, 1, State));
        false -> OtherDoor = null
    end,
    {reply, OtherDoor, State};

handle_call(_Request, _From, State) -> {reply, ok, State}.


handle_info(_Info, _State) -> ok.


code_change(_OldVsn, State, _Extra) -> {ok, State}.
