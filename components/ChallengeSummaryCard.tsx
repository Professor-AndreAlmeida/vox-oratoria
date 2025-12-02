import React from 'react';
import { Challenge, Milestone, GoalType } from '../types';
import { TargetIcon, FlagIcon, RecordIcon, CheckSquare } from './icons';

interface ChallengeSummaryCardProps {
    challenge: Challenge;
    onStartSkillDrill: (goalType: GoalType) => void;
}

const MilestoneItem: React.FC<{ milestone: Milestone; onStartSkillDrill: (goalType: GoalType) => void; }> = ({ milestone, onStartSkillDrill }) => {
    const isCompleted = milestone.status === 'completed';
    
    // Check if the milestone is a skill drill to show the practice button
    const canPractice = milestone.taskType === 'skill_drill' && !isCompleted;
    const goalTypeToPractice = milestone.target as GoalType;

    return (
        <div className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${isCompleted ? 'bg-green-500/10' : 'bg-background/50'}`}>
            <div className={`mt-1 ${isCompleted ? 'text-green-400' : 'text-primary'}`}>
                {isCompleted ? <CheckSquare className="w-5 h-5" /> : <FlagIcon className="w-5 h-5" />}
            </div>
            <div className="flex-grow text-left">
                <p className={`text-sm ${isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                    {milestone.description}
                </p>
            </div>
            {canPractice && (
                 <button
                    onClick={() => onStartSkillDrill(goalTypeToPractice)}
                    className="group flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs bg-secondary hover:bg-secondary-hover rounded-full font-semibold transition-colors duration-300"
                >
                    <RecordIcon className="w-3 h-3" />
                    Praticar
                </button>
            )}
        </div>
    );
};

export const ChallengeSummaryCard: React.FC<ChallengeSummaryCardProps> = ({ challenge, onStartSkillDrill }) => {
    return (
        <div>
            <div className="flex items-center gap-4 mb-4">
                <TargetIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                <div>
                    <h3 className="text-xl font-bold">{challenge.title}</h3>
                    <p className="text-sm text-text-secondary">{challenge.type === 'sprint' ? 'Sprint Rápido' : 'Missão de Carreira'}</p>
                </div>
            </div>
            
            <p className="text-sm text-text-secondary mb-6">{challenge.narrative}</p>

            <div className="space-y-3">
                {challenge.milestones.map((milestone, index) => (
                    <MilestoneItem key={index} milestone={milestone} onStartSkillDrill={onStartSkillDrill} />
                ))}
            </div>
        </div>
    );
};