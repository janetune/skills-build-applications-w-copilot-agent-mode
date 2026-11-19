import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const input = _input && typeof _input === 'object' ? _input as Record<string, unknown> : {};
  const userId = typeof input.userId === 'string' ? input.userId : '';
  const teamId = typeof input.teamId === 'string' ? input.teamId : '';
  const type = typeof input.type === 'string' ? input.type.trim() : '';
  const minutes = typeof input.minutes === 'number' ? input.minutes : Number.NaN;

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and minutes'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('Activity references must be valid ObjectIds'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity references an unknown user or team'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toJSON();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = _input && typeof _input === 'object' ? _input as Record<string, unknown> : {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  const members = Array.isArray(input.members) ? input.members : [];

  if (!name || !mascot) {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }
  if (members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw Object.assign(new Error('Team members must be valid ObjectIds'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (existingMembers.length !== memberIds.length) {
      throw Object.assign(new Error('Team references an unknown member'), { status: 404 });
    }
  }

  const team = await Team.create({ name, mascot, members: memberIds });
  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team.toJSON();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).select('_id name').lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .filter((entry) => teamNames.has(entry._id.toString()))
    .map((entry, index) => ({
      teamName: teamNames.get(entry._id.toString()),
      totalPoints: entry.totalPoints,
      rank: index + 1,
    }));
}

export async function suggestWorkouts(_userEmail: string) {
  const userEmail = typeof _userEmail === 'string' ? _userEmail.trim() : '';
  if (!userEmail) {
    throw Object.assign(new Error('A user email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  const focus = recentActivity?.type || user.fitnessGoal;
  const workouts = await Workout.find().lean();
  const matching = workouts.find((workout) => workout.focus === focus);
  const selected = matching ?? workouts.find((workout) => workout.focus === user.fitnessGoal) ?? workouts[0];

  if (!selected) return [];
  const reason = recentActivity?.type
    ? `Recommended for your recent ${recentActivity.type} activity and ${selected.focus} focus`
    : `Recommended to support your ${selected.focus} fitness goal`;

  return [{ ...selected, reason }];
}

export { User };
