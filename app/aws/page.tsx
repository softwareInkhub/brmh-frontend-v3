'use client'
import React from 'react';
import Link from 'next/link';
import { Sigma, Cloud, Database, UserCheck, Radio, Network } from 'lucide-react';

const awsServices = [
  { id: 'lambda', name: 'Lambda Functions', desc: 'Manage your Lambda functions', icon: <Sigma className="w-7 h-7 text-orange-500" />, route: '/aws/lambda' },
  { id: 's3', name: 'S3 Buckets', desc: 'Manage your S3 storage buckets', icon: <Cloud className="w-7 h-7 text-yellow-500" />, route: '/aws/s3' },
  { id: 'dynamodb', name: 'DynamoDB Tables', desc: 'Manage your DynamoDB tables', icon: <Database className="w-7 h-7 text-blue-500" />, route: '/aws/dynamodb' },
  { id: 'apigateway', name: 'API Gateway', desc: 'Manage your API endpoints', icon: <Network className="w-7 h-7 text-rose-900" />, route: '/aws/apigateway' },
  { id: 'iam', name: 'IAM Roles', desc: 'Manage your IAM roles and policies', icon: <UserCheck className="w-7 h-7 text-blue-600" />, route: '/aws/iam' },
  { id: 'sns', name: 'SNS', desc: 'Manage your SNS topics', icon: <Radio className="w-7 h-7 text-purple-500" />, route: '/aws/sns' },
  { id: 'brmh-iam', name: 'BRMH IAM', desc: 'Manage BRMH namespace roles and permissions', icon: <UserCheck className="w-7 h-7 text-indigo-600" />, route: '/BRMH-IAM' },
];

export default function AwsPage() {
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Services Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 md:mb-8">Monitor all your AWS services from one central dashboard</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {awsServices.map(service => (
            <Link href={service.route} key={service.id}>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-5 md:p-6 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                <div className="flex items-center gap-3 mb-2">
                  {service.icon}
                  <div className="font-semibold text-base md:text-lg text-gray-900 dark:text-white">{service.name}</div>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">{service.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 